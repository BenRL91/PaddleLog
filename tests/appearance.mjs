import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Window} from 'happy-dom';
const html=await fs.readFile('app/paddle.html','utf8'),script=await fs.readFile('public/appearance.js','utf8');
const window=new Window({url:'https://paddlelog.test'});window.document.write(html.replace(/<script[\s\S]*?<\/script>/g,''));
let systemLight=false,onSystemChange;
window.matchMedia=()=>({get matches(){return systemLight;},addEventListener:(_type,fn)=>onSystemChange=fn});
window.eval(script);window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
const root=window.document.documentElement,mode=window.document.getElementById('appearanceMode'),accent=window.document.getElementById('appearanceAccent');
assert.equal(root.dataset.appearance,'dark');
mode.value='light';mode.dispatchEvent(new window.Event('change'));assert.equal(root.dataset.appearance,'light');assert.equal(root.style.colorScheme,'light');
accent.value='ocean';accent.dispatchEvent(new window.Event('change'));assert.equal(root.dataset.accent,'ocean');
assert.deepEqual(JSON.parse(window.localStorage.getItem('paddlelog.appearance.v1')),{mode:'light',accent:'ocean'});
mode.value='system';mode.dispatchEvent(new window.Event('change'));assert.equal(root.dataset.appearance,'dark');systemLight=true;onSystemChange();assert.equal(root.dataset.appearance,'light');
window.dispatchEvent(new window.StorageEvent('storage',{key:'paddlelog.appearance.v1',newValue:'bad json'}));assert.equal(root.dataset.appearance,'dark');assert.equal(mode.value,'dark');
window.localStorage.setItem('paddlelog.appearance.v1',JSON.stringify({mode:'light',accent:'forest'}));window.eval(script);assert.equal(root.dataset.appearance,'light');assert.equal(root.dataset.accent,'forest');
assert.ok(html.includes('id="settingsAppearance"'));assert.equal((html.match(/id="appearanceMode"/g)||[]).length,1);
for(const name of ['rally','ocean','forest','violet','pink','teal','orange','gold','indigo','slate']){for(const display of ['dark','light']){mode.value=display;accent.value=name;accent.dispatchEvent(new window.Event('change'));assert.equal(root.dataset.accent,name);assert.equal(root.dataset.appearance,display);assert.equal(JSON.parse(window.localStorage.getItem('paddlelog.appearance.v1')).accent,name);}}
await window.happyDOM.abort();console.log('PASS: appearance modes, accent persistence, restart, OS changes, cross-tab invalid preference recovery and controls.');
