const button = document.querySelector('#activate');
const status = document.querySelector('#status');
button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const url = new URL(tab.url || 'about:blank');
    if (url.origin !== 'https://httpbin.org' || url.pathname !== '/forms/post') {
      status.textContent = 'This prototype supports only https://httpbin.org/forms/post. Open the test website above.';
      return;
    }
    await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['core.js', 'adapters/httpbin.js']});
    const css = (await Promise.all(['font.css', 'editorial-fonts.css', 'redesign.css'].map(async file => (await fetch(chrome.runtime.getURL(file))).text()))).join('\n');
    const [result] = await chrome.scripting.executeScript({target: {tabId: tab.id}, func: (css) => {
      const app = globalThis.__clarity;
      if (app.instance) return app.instance.toggle();
      const adapter = app.adapters.httpbin;
      if (!adapter.matches(document, location)) return {error: 'The form has changed. Original page kept intact.'};
      app.instance = app.create(document, adapter, css);
      return app.instance.toggle();
    }, args: [css]});
    status.textContent = result.result?.error || (result.result?.enabled ? 'Redesign on. Use the page switch to compare views.' : 'Original view restored. Your entries stay in place.');
    button.textContent = result.result?.enabled ? 'Switch to original' : 'Redesign this page';
  } catch {
    status.textContent = 'Could not access this page. Reload the test website and try again.';
  } finally { button.disabled = false; }
});
