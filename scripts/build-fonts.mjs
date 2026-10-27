import fs from 'node:fs';
const faces=[['ClaritySuperior','LTSuperiorSerif-Regular.otf',400],['ClarityInterDisplay','InterDisplay-Regular.otf',400],['ClarityInterDisplay','InterDisplay-Medium.otf',500]];
fs.writeFileSync('extension/editorial-fonts.css',faces.map(([family,file,weight])=>`@font-face{font-family:${family};src:url(data:font/otf;base64,${fs.readFileSync('assets/fonts/'+file).toString('base64')}) format('opentype');font-style:normal;font-weight:${weight};font-display:swap}`).join('\n'));
