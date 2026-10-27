const button = document.querySelector('#activate');
const status = document.querySelector('#status');
button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    const url = new URL(tab.url || 'about:blank');
    if (!['http:','https:'].includes(url.protocol)) {
      status.textContent = 'Open a normal HTTP or HTTPS webpage. Browser settings, PDF viewers and extension pages cannot be redesigned.';
      return;
    }
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['universal.js']});
    const css = (await Promise.all(['font.css','universal.css'].map(async file=>(await fetch(chrome.runtime.getURL(file))).text()))).join('\n');
    const [response] = await chrome.scripting.executeScript({target:{tabId:tab.id},func:(css)=>{
      const app=globalThis.__clarityUniversal;
      if(!app.instance)app.instance=app.create(document,css);
      return app.instance.toggle();
    },args:[css]});
    const result=response.result;
    status.textContent=result?.error || (result?.enabled ? `Redesign on. ${result.elements} elements enhanced locally.${result.framesLeftOriginal ? ' Cross-origin frames stay original.' : ''}` : 'Original view restored. Your entries stay in place.');
    button.textContent=result?.enabled?'Switch to original':'Redesign this page';
  } catch {
    status.textContent='Could not access this page. Some browser-protected pages disallow extensions. Reload an ordinary webpage and try again.';
  } finally {button.disabled=false;}
});
