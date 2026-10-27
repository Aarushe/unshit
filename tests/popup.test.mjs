import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
const script=await fs.readFile('extension/popup.js','utf8');
function setup(url, outcome={enabled:true}, fail=false){
 const status={textContent:''}, button={disabled:false,textContent:'',addEventListener(_,fn){this.click=fn;}};const calls=[];
 const context={document:{querySelector:s=>s==='#activate'?button:status}, URL, chrome:{tabs:{query:async()=>[{id:42,url}]},runtime:{getURL:f=>'chrome-extension://test/'+f},scripting:{executeScript:async args=>{calls.push(args);if(fail)throw Error('denied');return [{result:outcome}];}}},fetch:async()=>({text:async()=>''})};
 vm.runInNewContext(script,context);return {status,button,calls};
}
test('Popup activates on unrelated HTTP and HTTPS websites without adapters',async()=>{for(const url of ['https://httpbin.org/forms/post','https://indianvisaonline.gov.in/evisa/','https://indianvisaonline.gov.in/evisa/Registration','https://example.com/article','http://localhost:4173/']){const x=setup(url);await x.button.click();assert.equal(x.calls.length,2);assert.equal(x.calls[0].target.tabId,42);assert.deepEqual(Array.from(x.calls[0].files),['universal.js']);assert.match(x.status.textContent,/Redesign on/);assert.equal(x.button.disabled,false);}});
test('Popup rejects browser-only and non-web schemes',async()=>{for(const url of ['chrome://extensions','file:///tmp/private.html','about:blank','javascript:alert(1)',undefined]){const x=setup(url);await x.button.click();assert.equal(x.calls.length,0);assert.match(x.status.textContent,/normal HTTP/);assert.equal(x.button.disabled,false);}});
test('Popup reports failure and restores button after denied access',async()=>{let x=setup('https://example.com/',{error:'Changed document'});await x.button.click();assert.equal(x.status.textContent,'Changed document');x=setup('https://example.com/',{},true);await x.button.click();assert.match(x.status.textContent,/Could not access/);assert.equal(x.button.disabled,false);});
