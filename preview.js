const css = (await Promise.all(['/extension/font.css','/extension/editorial-fonts.css','/extension/redesign.css'].map(async file => (await fetch(file)).text()))).join('\n');
const app = globalThis.__clarity;
const theme = location.pathname === '/1' ? 'editorial' : 'tailwind';
app.instance = app.create(document, app.adapters.httpbin, css, {theme});
app.instance.set(true);
document.title = theme==='editorial' ? 'Clarity /1 · Editorial' : 'Clarity · Sans';
