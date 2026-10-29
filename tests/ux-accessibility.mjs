import assert from 'node:assert/strict';import fs from 'node:fs';import {Window} from 'happy-dom';
const html=fs.readFileSync('app/paddle.html','utf8'),w=new Window();w.document.write(html.replace(/<script[\s\S]*?<\/script>/g,''));
for(const dialog of w.document.querySelectorAll('[role=dialog],dialog')){const name=dialog.getAttribute('aria-label')||w.document.getElementById(dialog.getAttribute('aria-labelledby'))?.textContent;assert.ok(name,dialog.id+' needs an accessible name');}
for(const control of w.document.querySelectorAll('input,select,textarea')){if(control.type==='hidden'||control.closest('[hidden]'))continue;assert.ok(control.labels?.length||control.getAttribute('aria-label')||control.getAttribute('aria-labelledby'),control.id+' needs a label');}
assert.match(fs.readFileSync('public/ui-system.css','utf8'),/prefers-reduced-motion:reduce/);
assert.equal(w.document.getElementById('activeSessionBar').getAttribute('aria-live'),'off');assert.ok(w.document.querySelector('link[href="/ui-system.css"]'));
const colors=['#d92d38',...html.matchAll(/data-accent="\w+"\]\{--accent:(#[0-9a-f]{6})/g)].map(x=>typeof x==='string'?x:x[1]);
const lum=hex=>{const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
assert.equal(colors.length,10);for(const color of colors)assert.ok(1.05/(lum(color)+.05)>=4.5,color+' needs white-label contrast');
await w.happyDOM.abort();console.log('PASS: static dialog names, non-announcing timer ticks, shared styles, and white primary labels across all ten accents. Other color pairs require further visual/contrast review.');
