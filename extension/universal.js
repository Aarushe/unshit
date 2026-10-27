/* General, local enhancement engine. No form values, page text or files are exported. */
(() => {
  if (globalThis.__clarityUniversal) return;
  globalThis.__clarityUniversal = {create};
  function create(doc, css) {
    if (!doc.body || doc.contentType !== 'text/html') throw new Error('This document is not an HTML page.');
    const attr = 'data-cl-u-' + Math.random().toString(36).slice(2, 10);
    const rules = css.replaceAll('[data-cl-u', '[' + attr);
    const rootRecords = new Map(), markers = new Map(), frames = new Map();
    let enabled = false, destroyed = false, timer = 0;
    let backdropCache = new WeakMap();
    const topWin = doc.defaultView;
    const owned = new WeakSet();
    const protect = 'svg,canvas,video,audio,math,pre,code,[contenteditable]:not([contenteditable="false"]),[role="application"],[role="grid"],[role="tree"],[role="listbox"],[role="menu"],[role="slider"],[role="spinbutton"],object,embed';
    const ignore = 'script,style,link,meta,template,noscript,head';
    const host = doc.createElement('div'); owned.add(host);
    const shadow = host.attachShadow({mode:'open'});
    shadow.innerHTML = `<style>:host{all:initial;position:fixed!important;right:16px!important;bottom:16px!important;z-index:2147483647!important}*{box-sizing:border-box}.bar{display:flex;gap:4px;padding:5px;background:#fff;border:1px solid #ddd;border-radius:10px;box-shadow:0 3px 14px #0002;font:12px/1.4 system-ui;color:#222}button{font:inherit;color:#555;background:#fff;border:0;border-radius:6px;padding:9px 12px;cursor:pointer}button[aria-pressed=true]{background:#eee;color:#111}button:focus-visible{outline:2px solid #555;outline-offset:1px}</style><div class="bar" role="region" aria-label="Page appearance"><button id="original" type="button">Original</button><button id="redesigned" type="button">Redesigned</button><button id="close" type="button" aria-label="Remove redesign">×</button></div>`;
    doc.body.append(host);
    shadow.querySelector('#original').onclick = () => set(false);
    shadow.querySelector('#redesigned').onclick = () => set(true);
    shadow.querySelector('#close').onclick = () => api.destroy();
    function safe(el) {
      if (owned.has(el) || el.closest(protect) || el.closest(ignore)) return false;
      // Do not apply styling inside a protected ancestor across shadow boundaries.
      let root = el.getRootNode();
      while (root.host) { if (root.host.closest(protect) || owned.has(root.host)) return false; root = root.host.getRootNode(); }
      return true;
    }
    function mark(el, kinds) {
      if (!kinds.length) return;
      const value = kinds.join(' ');
      if (!markers.has(el)) markers.set(el, el.getAttribute(attr));
      if (el.getAttribute(attr) !== value) el.setAttribute(attr,value);
    }
    function blockedBackdrop(el) {
      if (!el || el.tagName === 'HTML') return false;
      if (backdropCache.has(el)) return backdropCache.get(el);
      const blocked = el.ownerDocument.defaultView.getComputedStyle(el).backgroundImage !== 'none' || blockedBackdrop(el.parentElement);
      backdropCache.set(el, blocked);
      return blocked;
    }
    function classify(el) {
      if (!safe(el)) return;
      const win = el.ownerDocument.defaultView, tag = el.tagName.toLowerCase();
      const style = win.getComputedStyle(el);
      if (style.display==='none' || style.visibility==='hidden' || el.hidden) return;
      if (blockedBackdrop(el)) return;
      const kinds=[];
      const positioned = ['absolute','fixed','sticky'].includes(style.position) || style.transform!=='none';
      const opaque = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
      if (['body','main','article','section','aside','header','footer','nav','div','form','fieldset','td','th','table','dialog'].includes(tag) && (opaque || tag==='body')) kinds.push('surface');
      if (tag==='body') kinds.push('page');
      if (['p','li','dt','dd','label','legend','td','th','figcaption','summary','a','h1','h2','h3','h4','h5','h6'].includes(tag)) kinds.push('type');
      if (/^h[1-6]$/.test(tag)) kinds.push(tag);
      if (tag==='a') kinds.push('link');
      if (['p','li','dd'].includes(tag) && !positioned) kinds.push('reading');
      if ((tag==='main' || tag==='article') && !positioned && ['block','flow-root'].includes(style.display)) kinds.push('content');
      if (tag==='form' && !positioned && !el.matches('[role=search]') && el.querySelectorAll('input:not([type=hidden]),select,textarea').length>=3) kinds.push('form');
      if (tag==='fieldset' && !positioned) kinds.push('group');
      if (tag==='legend') kinds.push('legend');
      if (tag==='label') {
        kinds.push('label');
        if (el.querySelector('input[type=radio],input[type=checkbox]')) kinds.push('option');
      }
      if (['input','textarea','select'].includes(tag)) {
        const type = el.type;
        if (tag==='input' && ['hidden','image','range','color'].includes(type)) return;
        if (['radio','checkbox'].includes(type)) kinds.push('check');
        else if (['submit','button','reset'].includes(type)) kinds.push('button');
        else kinds.push('control');
      }
      if (tag==='button' && (el.textContent || '').trim() && !el.querySelector('svg,img,canvas')) kinds.push('button');
      // Use only a simple existing field wrapper; never move controls into new groups.
      if (['p','div'].includes(tag) && !positioned && ['block','flow-root'].includes(style.display)) {
        const controls=el.querySelectorAll('input:not([type=hidden]),select,textarea');
        if (controls.length===1 && !el.querySelector('table,fieldset,form,button,div div') && el.closest('form') && !['radio','checkbox','submit','button','reset'].includes(controls[0].type)) kinds.push('field');
      }
      if (tag==='table' && !positioned) kinds.push('table');
      if (['td','th'].includes(tag) && !positioned) kinds.push('cell');
      mark(el,kinds);
    }
    function schedule() {
      if (!enabled || timer) return;
      timer=topWin.setTimeout(()=>{timer=0;scan();},120);
    }
    function attach(root) {
      if (rootRecords.has(root)) return;
      const owner = root.nodeType===9 ? root : root.ownerDocument;
      const style=owner.createElement('style');owned.add(style);
      style.textContent=rules;
      (root.nodeType===9 ? root.head || root.documentElement : root).append(style);
      style.disabled = true;
      const observer=new owner.defaultView.MutationObserver(records=>{
        if(records.some(r=>!owned.has(r.target) && (r.type==='attributes' || [...r.addedNodes,...r.removedNodes].some(n=>!owned.has(n))))) schedule();
      });
      // Attribute filters exclude our markers. Observe visibility and structure changes without a loop.
      observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden','open','disabled','type','role','contenteditable']});
      rootRecords.set(root,{style,observer});
    }
    function scanRoot(root,seen) {
      if(seen.has(root))return;seen.add(root);attach(root);
      for(const el of root.querySelectorAll('*')) {
        if(owned.has(el))continue;
        if(el.shadowRoot && safe(el))scanRoot(el.shadowRoot,seen);
        if(el.tagName==='IFRAME') {
          if(!frames.has(el)){const listener=()=>schedule();el.addEventListener('load',listener);frames.set(el,listener);}
          try {const d=el.contentDocument;if(d?.body && d.contentType==='text/html')scanRoot(d,seen);}catch{/* Browser-enforced cross-origin boundary. */}
          continue;
        }
        // Reclassify using host styles, not the previous enhancement.
        classify(el);
      }
    }
    function scan() {
      if(!enabled)return;
      backdropCache = new WeakMap();
      for (const [frame, listener] of frames) if (!frame.isConnected) { frame.removeEventListener('load', listener); frames.delete(frame); }
      // Disable only our sheets while measuring. Re-enable before returning to rendering.
      for(const {style} of rootRecords.values())style.disabled=true;
      for(const [el] of markers){if(!el.isConnected)markers.delete(el);else el.removeAttribute(attr);}
      try {
        const seen=new Set();scanRoot(doc,seen);
        for(const [root,record] of rootRecords)if(!seen.has(root)){record.observer.disconnect();record.style.remove();rootRecords.delete(root);}
      } finally {for(const {style} of rootRecords.values())style.disabled=false;}
      if(!host.isConnected && doc.body)doc.body.append(host);
    }
    function stop() {
      topWin.clearTimeout(timer);timer=0;
      for(const {observer,style} of rootRecords.values()){observer.disconnect();style.remove();}rootRecords.clear();
      for(const [frame,listener] of frames)frame.removeEventListener('load',listener);frames.clear();
      for(const [el,previous] of markers){if(previous===null)el.removeAttribute(attr);else el.setAttribute(attr,previous);}markers.clear();
    }
    function stats() {
      const count=kind=>[...markers.keys()].filter(el=>el.isConnected && el.getAttribute(attr)?.split(' ').includes(kind)).length;
      return {enabled,elements:markers.size,forms:count('form'),controls:count('control')+count('check'),roots:rootRecords.size,framesLeftOriginal:[...frames.keys()].filter(frame=>{try{return !frame.contentDocument;}catch{return true;}}).length};
    }
    function set(value) {
      if(destroyed)return {error:'Redesign removed. Activate again from the extension.'};
      if(enabled!==value){enabled=value;if(enabled){try{scan();}catch{enabled=false;stop();return {error:'This page could not be safely enhanced. Original restored.'};}}else stop();}
      shadow.querySelector('#original').setAttribute('aria-pressed',String(!enabled));
      shadow.querySelector('#redesigned').setAttribute('aria-pressed',String(enabled));
      return stats();
    }
    const api={set,toggle:()=>set(!enabled),stats,refresh:scan,destroy(){set(false);host.remove();destroyed=true;if(globalThis.__clarityUniversal.instance===api)globalThis.__clarityUniversal.instance=null;},get enabled(){return enabled;}};
    return api;
  }
})();
