(() => {
  if (globalThis.__clarity) return;
  globalThis.__clarity = {adapters: {}, create};
  function create(doc, adapter, css, options = {}) {
    let theme = options.theme === "editorial" ? "editorial" : "tailwind";
    const form = doc.querySelector('form');
    if (!adapter.validate(form)) throw new Error('Unsupported form structure');
    const win = doc.defaultView;
    let enabled = false, destroyed = false, observer;
    let added = [], attributes = [], errors = new Map();
    const touched = new Set();
    const host = doc.createElement('div');
    host.id = 'clarity-toolbar';
    host.dataset.theme = theme;
    const shadow = host.attachShadow({mode: 'open'});
    shadow.innerHTML = `<style>
      :host{display:block!important;position:relative!important;z-index:2147483647!important;color-scheme:light}
      *{box-sizing:border-box}.bar{font:13px/1.4 ClarityInter,Inter,system-ui,sans-serif;background:#fff;color:#262626;border-bottom:1px solid #e5e5e5;padding:12px max(20px,calc((100vw - 680px)/2));display:flex;align-items:center;justify-content:flex-end;gap:20px;flex-wrap:wrap}
      .brand{font-weight:600;font-size:19px;letter-spacing:-.4px;display:flex;align-items:center;gap:10px}.tag{font-size:11px;letter-spacing:0;font-weight:400;color:#737373}.actions{display:flex;gap:6px;align-items:center}button{font:500 12px ClarityInter,Inter,system-ui;cursor:pointer;border:1px solid #e5e5e5;border-radius:6px;background:#fff;color:#737373;padding:9px 13px;min-height:36px}button[aria-pressed=true]{background:#f0f0f0;color:#262626;border-color:#d4d4d4}button:focus-visible{outline:2px solid #525252;outline-offset:3px}.privacy{font-size:11px;color:#737373;margin-right:12px}.privacy b{font-weight:400}
      :host([data-theme=editorial]) .bar,:host([data-theme=editorial]) button{font-family:ClarityInterDisplay,Inter,sans-serif}
      @media(max-width:580px){.bar{padding:12px 20px;gap:12px}.privacy{display:none}.actions{margin-left:auto}.tag{display:none}.brand{font-size:19px}.actions button{padding:8px 10px}}
      </style><div class="bar" role="region" aria-label="Clarity view controls"><div class="actions"><button id="original" type="button">Original</button><button id="redesign" type="button">Redesigned</button><button id="close" type="button" aria-label="Remove Clarity">×</button></div></div>`;
    doc.body.prepend(host);
    shadow.querySelector('#original').onclick = () => set(false);
    shadow.querySelector('#redesign').onclick = () => set(true);
    shadow.querySelector('#close').onclick = () => {
      set(false); host.remove(); destroyed = true;
      if (globalThis.__clarity.instance === api) globalThis.__clarity.instance = null;
    };
    function add(node, parent, before = null) { parent.insertBefore(node, before); added.push(node); return node; }
    // Restore only attributes still holding our value; never undo a later site change.
    function attr(node, name, value) {
      const existing = attributes.find(a => a.node === node && a.name === name);
      if (existing) existing.applied = value;
      else attributes.push({node, name, original: node.getAttribute(name), applied: value});
      node.setAttribute(name, value);
    }
    function describe(node, id) {
      const tokens = new Set((node.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      tokens.add(id); attr(node, 'aria-describedby', [...tokens].join(' '));
    }
    function controls() { return [...form.querySelectorAll('input, select, textarea')]; }
    function errorMessage(input) { return input.validationMessage; }
    function syncErrors() {
      for (const [input, node] of errors) {
        if (!input.isConnected || !form.contains(input)) { node.remove(); errors.delete(input); touched.delete(input); }
      }
      for (const input of controls()) {
        const invalid = touched.has(input) && input.willValidate && !input.validity.valid;
        let node = errors.get(input);
        if (!node && invalid) {
          node = doc.createElement('span'); node.className = 'cl-error';
          node.id = `cl-error-${++errorSequence}`; node.setAttribute('aria-live', 'polite');
          add(node, input.parentElement); errors.set(input, node); describe(input, node.id);
        }
        if (node) {
          const message = invalid ? errorMessage(input) : '';
          if (node.textContent !== message) node.textContent = message;
          node.hidden = !invalid;
          attr(input, 'aria-invalid', invalid ? 'true' : 'false');
        }
      }
    }
    let errorSequence = 0;
    function invalid(event) { touched.add(event.target); syncErrors(); }
    function edit(event) { if (event.type === 'focusout') touched.add(event.target); syncErrors(); }
    function reset() { win.setTimeout(() => { if (enabled) { touched.clear(); syncErrors(); } }, 0); }
    function set(on) {
      if (destroyed) return {error: 'Clarity has been removed. Activate again from the extension.'};
      if (on === enabled) return {enabled};
      if (on && !adapter.validate(form)) return {error: 'The form has changed. Original page kept intact.'};
      enabled = on;
      if (on) {
        if (!doc.querySelector('meta[name=viewport]')) { const viewport = doc.createElement('meta'); viewport.name = 'viewport'; viewport.content = 'width=device-width, initial-scale=1'; add(viewport, doc.head); }
        const style = doc.createElement('style'); style.textContent = css; add(style, doc.head);
        attr(doc.documentElement, 'data-clarity', adapter.id);
        attr(doc.documentElement, 'data-clarity-theme', theme);
        attr(form, 'data-clarity-form', '');
        form.addEventListener('invalid', invalid, true);
        form.addEventListener('input', edit);
        form.addEventListener('change', edit);
        form.addEventListener('focusout', edit);
        form.addEventListener('reset', reset);
        observer = new win.MutationObserver(() => syncErrors());
        observer.observe(form, {childList:true, subtree:true});
      } else {
        observer?.disconnect();
        form.removeEventListener('invalid', invalid, true);
        form.removeEventListener('input', edit);
        form.removeEventListener('change', edit);
        form.removeEventListener('focusout', edit);
        form.removeEventListener('reset', reset);
        added.forEach(node => node.remove()); added = [];
        for (const {node, name, original, applied} of attributes.reverse()) {
          if (node.getAttribute(name) === applied) {
            if (original === null) node.removeAttribute(name); else node.setAttribute(name, original);
          }
        }
        attributes = []; errors.clear(); touched.clear();
      }
      shadow.querySelector('#original').setAttribute('aria-pressed', String(!enabled));
      shadow.querySelector('#redesign').setAttribute('aria-pressed', String(enabled));
      return {enabled};
    }
    const api = {toggle: () => set(!enabled), set, get enabled() {return enabled;}};
    return api;
  }
})();
