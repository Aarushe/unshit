const css = (await Promise.all(['/extension/font.css','/extension/editorial-fonts.css','/extension/redesign.css'].map(async file => (await fetch(file)).text()))).join('\n');
const app = globalThis.__clarity;
const results = document.querySelector('#test-results');
const button = document.querySelector('#run-tests');
button.onclick = async () => {
 button.disabled = true; let passed = 0, failed = 0; results.textContent = '';
 const check = async (name, fn) => {try {await fn(); passed++; results.textContent += `PASS ${name}\n`;} catch(e) {failed++; results.textContent += `FAIL ${name}: ${e.message}\n`;}};
 const assert = (value, msg='Assertion failed') => {if(!value) throw new Error(msg);};
 const tick = () => new Promise(r => setTimeout(r, 0));
 const form = document.querySelector('form');
 const originalHTML = form.outerHTML;
 const nodes = [...form.querySelectorAll('input,textarea,button')];
 const input = name => form.querySelector(`[name="${name}"]`);
 input('custname').value = 'Prototype Tester'; input('custemail').value = 'test@example.com';
 input('custtel').value = '5550100'; input('size').checked = true; input('topping').checked = true;
 input('comments').value = 'Synthetic test data'; input('delivery').value = '12:30';
 let events = 0; input('custname').addEventListener('input', () => events++);
 const before = JSON.stringify([...new FormData(form)]);
 const theme = new URLSearchParams(location.search).get('theme') === 'editorial' ? 'editorial' : 'tailwind';
 const api = app.create(document, app.adapters.httpbin, css, {theme}); app.instance=api;
 await check('Exact live URL supported; lookalike and changed form rejected', () => {
  assert(app.adapters.httpbin.matches(document,new URL('https://httpbin.org/forms/post')));
  assert(!app.adapters.httpbin.matches(document,new URL('https://httpbin.org.evil.example/forms/post')));
  assert(!app.adapters.httpbin.matches(document,new URL('https://httpbin.org/anything')));
  const copy=form.cloneNode(true); copy.querySelector('[name=custemail]').remove(); assert(!app.adapters.httpbin.validate(copy));
 });
 await check('Original controls and FormData preserved on activation', () => {
  api.set(true); assert(nodes.every(n=>form.contains(n))); assert(JSON.stringify([...new FormData(form)])===before);
 });
 await check('Existing event listeners still run', () => { input('custname').dispatchEvent(new Event('input',{bubbles:true}));assert(events===1); });
 await check('Repeated toggles restore exact markup and preserve entered values', () => {
  for(let i=0;i<10;i++){api.set(false);assert(form.outerHTML===originalHTML,'Markup changed after disable');api.set(true);}
  assert(JSON.stringify([...new FormData(form)])===before); assert(document.querySelectorAll('.cl-intro').length===0);
 });
 await check('Invalid email is rejected and gets associated inline guidance', () => {
  input('custemail').value='invalid';assert(!input('custemail').checkValidity());
  assert(input('custemail').getAttribute('aria-invalid')==='true');
  assert(document.getElementById(input('custemail').getAttribute('aria-describedby')).textContent===input('custemail').validationMessage);
  input('custemail').value='test@example.com';input('custemail').dispatchEvent(new Event('input',{bubbles:true}));
  assert(input('custemail').validity.valid);assert(input('custemail').getAttribute('aria-invalid')==='false');
 });
 await check('Time bounds and quarter-hour validation remain native', () => {
  input('delivery').value='10:00';assert(!input('delivery').checkValidity());
  input('delivery').value='12:07';assert(!input('delivery').checkValidity());
  input('delivery').value='12:30';assert(input('delivery').checkValidity());
 });
 await check('Labels still select native radio and checkbox controls', () => {
  const medium=form.querySelector('[value=medium]');medium.parentElement.click();assert(medium.checked&&!input('size').checked);
  const cheese=form.querySelector('[value=cheese]');cheese.parentElement.click();assert(cheese.checked);
 });
 await check('Site-owned conditional fields and delegated change events survive', async () => {
  const p=document.createElement('p');p.innerHTML='<label>Test-only gift note <input name="gift" required></label>';p.hidden=true;form.append(p);
  const cheese=form.querySelector('[value=cheese]');
  const listener=()=>{p.hidden=!cheese.checked;p.querySelector('input').disabled=!cheese.checked;};
  cheese.addEventListener('change',listener);cheese.checked=false;cheese.dispatchEvent(new Event('change',{bubbles:true}));assert(p.hidden);
  cheese.click();assert(!p.hidden&&!p.querySelector('input').disabled);await tick();
  assert(!p.querySelector('input').checkValidity());assert(p.querySelector('.cl-error'));
  p.querySelector('input').value='A local note';api.set(false);api.set(true);
  assert(p.querySelector('input').value==='A local note'&&!p.hidden);p.remove();cheese.removeEventListener('change',listener);await tick();
 });
 await check('File input identity, selected file and upload payload survive toggles', () => {
  const p=document.createElement('p');const file=document.createElement('input');file.type='file';file.name='attachment';p.append(file);form.append(p);
  const dt=new DataTransfer();dt.items.add(new File(['test-only file'],'test.txt',{type:'text/plain'}));file.files=dt.files;
  api.set(false);api.set(true);assert(file.files[0].name==='test.txt');assert(new FormData(form).get('attachment').size===14);p.remove();
 });
 await check('Native submit blocks invalid fields before reaching submit listeners', () => {
  let count=0;const listener=e=>{count++;e.preventDefault();};form.addEventListener('submit',listener);
  input('custemail').value='bad';form.requestSubmit();assert(count===0);
  input('custemail').value='test@example.com';form.requestSubmit();assert(count===1);form.removeEventListener('submit',listener);
 });
 await check('Original POST reaches local endpoint with unchanged field names and values', async () => {
  const frame=document.createElement('iframe');frame.name='submission-test';frame.hidden=true;document.body.append(frame);
  const originalTarget=form.getAttribute('target');form.target=frame.name;
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Submission timed out')),5000);frame.onload=()=>{try{const text=frame.contentDocument.querySelector('#result')?.textContent;if(!text)return;const received=JSON.parse(text);assert(received.form.some(([k,v])=>k==='custname'&&v==='Prototype Tester'));assert(received.form.some(([k,v])=>k==='size'&&v==='medium'));clearTimeout(timeout);resolve();}catch(e){clearTimeout(timeout);reject(e);}};form.requestSubmit();});
  if(originalTarget===null)form.removeAttribute('target');else form.setAttribute('target',originalTarget);frame.remove();
 });
 await check('Native reset clears values and extension errors', async () => {input('custemail').value='bad';input('custemail').checkValidity();form.reset();await tick();assert(input('custemail').value==='');assert(![...form.querySelectorAll('.cl-error')].some(n=>!n.hidden));});
 await check('Host attribute changes are not overwritten during rollback', () => {input('delivery').setAttribute('aria-describedby','site-added');api.set(false);assert(input('delivery').getAttribute('aria-describedby')==='site-added');input('delivery').removeAttribute('aria-describedby');});
 await check('Bundled Inter loads successfully', async () => {await document.fonts.load('16px ClarityInter');assert(document.fonts.check('16px ClarityInter'));if(theme==='editorial'){await document.fonts.load('16px ClaritySuperior');await document.fonts.load('16px ClarityInterDisplay');assert(document.fonts.check('16px ClaritySuperior'));assert(document.fonts.check('16px ClarityInterDisplay'));}});
 await check('375px layout stays within viewport with readable controls', async () => {
  const frame=document.createElement('iframe');frame.style.cssText='width:375px;height:812px;border:0';frame.src=theme==='editorial'?'/1':'/forms/post';document.body.append(frame);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Mobile frame timeout')),5000);frame.onload=()=>{clearTimeout(timer);resolve();};});
  await new Promise(r=>setTimeout(r,200));const d=frame.contentDocument;assert(d.querySelector('[data-clarity-form]'),'Redesign not ready');assert(d.documentElement.scrollWidth<=frame.clientWidth,'Horizontal overflow');assert(d.querySelector('[name=custname]').getBoundingClientRect().height>=44);frame.remove();
 });
 await check('Close removes toolbar, styles, errors and all added page elements', () => {api.set(true);document.querySelector('#clarity-toolbar').shadowRoot.querySelector('#close').click();assert(!document.querySelector('#clarity-toolbar'));assert(!document.querySelector('.cl-intro'));assert(!document.documentElement.hasAttribute('data-clarity'));assert(form.outerHTML===originalHTML);});
 results.textContent += `\n${passed} passed, ${failed} failed.\nUploads and conditional fields are local fixture tests; they do not exist on the live httpbin form.`;
 document.title=`${failed?'FAIL':'PASS'} · ${passed} compatibility tests`;button.textContent='Tests complete — reload to run again';
};
