import {mkdirSync, rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
mkdirSync('dist',{recursive:true});
rmSync('dist/clarity-extension.zip',{force:true});
execFileSync('zip',['-qr','../dist/clarity-extension.zip','manifest.json','popup.html','popup.css','popup.js','core.js','universal.js','universal.css','redesign.css','font.css','editorial-fonts.css','INTER-LICENSE.txt','LT-SUPERIOR-LICENSE.txt','adapters'],{cwd:'extension'});
console.log('Created dist/clarity-extension.zip. Extract it, then load the extracted folder as an unpacked extension.');
