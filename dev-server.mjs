import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const fixture = await fs.readFile(path.join(root, 'tests/fixtures/httpbin.html'), 'utf8');
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export const server = http.createServer(async (req, res) => {
  if (!/^localhost(?::\d+)?$|^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host || '')) {res.writeHead(403);res.end();return;}
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/post') {
    let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 1024*1024) {res.writeHead(413);res.end();return;} }
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(`<html><head><title>Local submission result</title></head><body><h1>Original form submission received</h1><p>This response is from the local test server, not httpbin.</p><pre id="result">${escape(JSON.stringify({form:[...new URLSearchParams(body)],contentType:req.headers['content-type']},null,2))}</pre><a href="/forms/post">Back to demo</a></body></html>`); return;
  }
  if (url.pathname === '/1' || url.pathname === '/' || url.pathname === '/forms/post' || url.pathname === '/tests') {
    res.setHeader('Content-Type','text/html; charset=utf-8');
    const test = url.pathname === '/tests';
    res.end(fixture.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Clarity · local preview</title>')
      .replace('</body>', `${test ? '<section id="test-panel"><button id="run-tests">Run compatibility tests</button><pre id="test-results">Ready</pre></section>' : ''}<script src="/extension/core.js"></script><script src="/extension/adapters/httpbin.js"></script><script type="module" src="${test ? '/tests/browser-tests.js' : '/preview.js'}"></script></body>`));return;
  }
  if (url.pathname === '/universal-tests') {
    res.setHeader('Content-Type','text/html');
    res.end('<button id=run>Run general engine tests</button><pre id=result>Ready</pre><script src=/extension/universal.js></script><script type=module src=/tests/universal-browser.js></script>'); return;
  }
  const allowed = ['/extension/', '/tests/browser-tests.js', '/tests/universal-browser.js', '/preview.js'];
  if (!allowed.some(prefix => url.pathname.startsWith(prefix))) {res.writeHead(404);res.end('Not found');return;}
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403);res.end();return;}
  try {
    const content = await fs.readFile(file);
    res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)] || 'text/plain');
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
if (process.argv[1] === fileURLToPath(import.meta.url)) server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log('Clarity preview: http://localhost:4173/forms/post · Tests: http://localhost:4173/tests'));
