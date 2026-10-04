import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {Window} from 'happy-dom';
const source=fs.readFileSync('public/app.js','utf8');
const code=source.slice(source.indexOf("  const navigationKey="),source.indexOf('  function openModal('));
const window=new Window({url:'https://test.local'}),document=window.document;
document.body.innerHTML=fs.readFileSync('app/paddle.html','utf8');
for(const id of ['settingsGeneral','settingsProfile','settingsAccount','settingsAppearance','settingsStorage'])if(!document.getElementById(id)){const el=document.createElement('div');el.id=id;document.body.append(el);}
const api=vm.runInNewContext(code+';({switchView,showSettings,restoreNavigation})',{window,document,$:id=>document.getElementById(id)});
for(const view of ['main','paddles','timeline','sessions','data']){api.switchView(view);document.body.dataset.page='main';api.restoreNavigation();assert.equal(document.body.dataset.page,view);assert(document.querySelector('.navbtn[data-view="'+view+'"]').classList.contains('active'));assert(!document.getElementById('view'+view[0].toUpperCase()+view.slice(1)).classList.contains('hide'));}
for(const section of ['general','profile','account','appearance','storage']){api.switchView('data');api.showSettings(section);api.restoreNavigation();assert.equal(document.body.dataset.page,'data');assert(document.getElementById('settingsRoot').classList.contains('hide'));assert(!document.getElementById('settings'+section[0].toUpperCase()+section.slice(1)).classList.contains('hide'));}
window.sessionStorage.setItem('paddleLog.navigation','bad JSON');api.restoreNavigation();assert.equal(document.body.dataset.page,'main');
window.sessionStorage.setItem('paddleLog.navigation',JSON.stringify({view:'unknown'}));api.restoreNavigation();assert.equal(document.body.dataset.page,'main');
window.sessionStorage.setItem=()=>{throw Error('Storage blocked')};api.switchView('sessions');assert.equal(document.body.dataset.page,'sessions');
console.log('PASS: every tab and Settings section restores, invalid saved state defaults to Home, and blocked storage does not break navigation.');
