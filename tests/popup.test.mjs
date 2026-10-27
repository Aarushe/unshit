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
test('Popup injects core and adapter only into exact supported URL',async()=>{const x=setup('https://httpbin.org/forms/post');await x.button.click();assert.equal(x.calls.length,2);assert.equal(x.calls[0].target.tabId,42);assert.deepEqual(Array.from(x.calls[0].files),['core.js','adapters/httpbin.js']);assert.match(x.status.textContent,/Redesign on/);assert.equal(x.button.disabled,false);});
test('Popup denies unsupported, spoofed and restricted pages without injection',async()=>{for(const url of ['https://httpbin.org.evil.test/forms/post','http://httpbin.org/forms/post','chrome://extensions','https://httpbin.org/post','https://indianvisaonline.gov.in/evisa/','https://indianvisaonline.gov.in/evisa/Registration',undefined]){const x=setup(url);await x.button.click();assert.equal(x.calls.length,0);assert.match(x.status.textContent,/supports only/);assert.equal(x.button.disabled,false);}});
test('Popup exposes adapter failure and restores enabled button after denied access',async()=>{let x=setup('https://httpbin.org/forms/post',{error:'Changed form'});await x.button.click();assert.equal(x.status.textContent,'Changed form');x=setup('https://httpbin.org/forms/post',{},true);await x.button.click();assert.match(x.status.textContent,/Could not access/);assert.equal(x.button.disabled,false);});
