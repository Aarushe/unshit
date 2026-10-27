const result=document.querySelector('#result');
const pause=()=>new Promise(resolve=>setTimeout(resolve,250));
document.querySelector('#run').onclick=async()=>{
 result.textContent='Running…'; const lines=[];let app,frame;
 const check=(name,ok)=>{if(!ok)throw Error(name);lines.push('PASS '+name);result.textContent=lines.join('\n');};
 try{
 const css=await (await fetch('/extension/universal.css')).text();
 frame=document.createElement('iframe');frame.style.cssText='width:375px;height:600px;border:1px solid #ddd';
 frame.srcdoc=`<!doctype html><meta name=viewport content="width=device-width"><main><h1>Contact</h1><p>Choose your preferences.</p><form><p><label>Email <input name=email type=email required></label></p><p><label>Name <input name=name></label></p><p><label>Attachment <input name=file type=file></label></p><fieldset><legend>Preferences</legend><label><input type=checkbox name=news>News</label></fieldset><button>Send</button></form><details><summary>Details</summary><p>More information</p></details><div contenteditable=true><p>Editor</p></div><dialog>Closed dialog</dialog><div id=shadow></div><iframe srcdoc="<p>Embedded content</p>"></iframe></main>`;
 const loaded=new Promise(r=>frame.onload=r);document.body.append(frame);await loaded;
 const d=frame.contentDocument,f=d.querySelector('form'),email=f.elements.email;
 const sh=d.querySelector('#shadow').attachShadow({mode:'open'});sh.innerHTML='<label>Shadow input <input></label>';
 const before=d.body.innerHTML, editor=d.querySelector('[contenteditable]').outerHTML;
 let submitted=0;f.addEventListener('submit',e=>{e.preventDefault();submitted++;});
 email.value='test@example.test';f.elements.name.value='Local test';
 const transfer=new DataTransfer();transfer.items.add(new File(['fixture'],'test.txt',{type:'text/plain'}));f.elements.file.files=transfer.files;
 app=__clarityUniversal.create(d,css);app.set(true);
 check('General document and form classified',app.stats().forms===1 && app.stats().controls>=4);
 check('Open shadow and same-origin frame enhanced',app.stats().roots===3);
 check('Original controls and values retained',f.elements.email===email && email.value==='test@example.test');
 check('File retained',f.elements.file.files[0].name==='test.txt');
 check('Editor subtree unchanged',d.querySelector('[contenteditable]').outerHTML===editor);
 check('Closed dialog stays hidden',d.defaultView.getComputedStyle(d.querySelector('dialog')).display==='none');
 email.value='bad';f.requestSubmit();check('Native invalid submission blocked',submitted===0 && !email.validity.valid);
 email.value='test@example.test';f.requestSubmit();check('Original submit listener retained',submitted===1);
 const added=d.createElement('p');added.innerHTML='<label>New field <input name=new></label>';f.append(added);await pause();
 check('Dynamic field enhanced',d.defaultView.getComputedStyle(added.querySelector('input')).minHeight==='44px');added.remove();await pause();
 for(let i=0;i<5;i++){app.set(false);app.set(true);}
 check('Repeated toggle retains file and values',f.elements.file.files.length===1 && email.value==='test@example.test');
 check('Mobile fixture has no horizontal overflow',d.documentElement.scrollWidth<=d.documentElement.clientWidth);
 app.destroy();check('Exact DOM restoration',d.body.innerHTML===before);
 result.textContent=lines.join('\n')+'\n12/12 passed';
 }catch(e){result.textContent=lines.join('\n')+'\nFAIL '+e.message;app?.destroy();}
};
