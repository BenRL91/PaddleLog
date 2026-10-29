import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {Window} from 'happy-dom';
import {validate} from '../public/validate.js';
import {applyChanges} from '../public/record-sync.js';
const window=new Window({url:'https://test.local'}),document=window.document;
document.write(fs.readFileSync('app/paddle.html','utf8').replace(/<script[\s\S]*?<\/script>/g,''));
Object.assign(globalThis,{window,document,localStorage:window.localStorage,FormData:window.FormData});
window.setInterval=()=>0;
const source=fs.readFileSync('public/app.js','utf8');const imports={};
for(const match of source.matchAll(/^import (.+) from '([^']+)';$/gm)){
 const mod=await import('../public/'+match[2].replace(/^\//,''));
 if(match[1].startsWith('* as '))imports[match[1].slice(5)]=mod;
 else for(const name of match[1].replace(/[{}]/g,'').split(',').map(x=>x.trim()))imports[name]=mod[name];
}
let state=validate({version:2,paddles:[{id:'a',brand:'A',model:'First',status:'active',maintenance:[{id:'grip',kind:'overgrip',action:'install',at:'2026-01-01T00:00:00Z',interval:4}]},{id:'b',brand:'B',model:'Second',nickname:'Backup',status:'active'},{id:'c',brand:'C',model:'Retired',status:'archived'}],sessions:[{id:'s',paddleId:'a',start:'2026-01-02T10:00:00Z',end:'2026-01-02T12:00:00Z'}],usagePeriods:[],settings:{mainPaddleId:'a'}}),revision=0;
const rules=JSON.parse(fs.readFileSync('public/competition-data.json'));
const fetcher=async(url,options={})=>{let data={};if(url==='/api/state'){if(options.method==='PATCH'){const body=JSON.parse(options.body);state=validate(applyChanges(state,body.changes));revision++;}data={state,revision,accountId:'account'};}else if(url==='/api/competition')data=rules;else if(url==='/reference-catalog.json')data=[];else if(url==='/api/auth/methods')data={accountId:'account',email:'test@example.test'};return {ok:true,status:200,json:async()=>data};};
globalThis.fetch=fetcher;
const context=vm.createContext({...imports,window,document,localStorage:window.localStorage,crypto,structuredClone,Date,console,AbortController,AbortSignal,setTimeout,clearTimeout,fetch:fetcher,askConfirm:async()=>true,pendingPhoto:async()=>null,createBilling:()=>({refresh:async()=>{},useAccount(){},authorize:async()=>true})});
const script=source.replace(/^import .*;\n/gm,'');vm.runInContext(script.slice(0,script.lastIndexOf('  if(document.readyState'))+'globalThis.testApp={setState(v){state=v;usageCache.reset(v.sessions);},init,renderAll,load,activeTimer,renderMain,renderPaddles,endTimer,timerKey,renderTimer,openModal,closeModal,switchView};})();',context);
const app=context.testApp,tick=()=>new Promise(r=>setTimeout(r,0));app.init();for(let i=0;i<8;i++)await tick();

for(const count of [100,250,500]){
 const paddles=Array.from({length:count},(_,i)=>({id:'p'+i,brand:'Synthetic',model:'Model '+String(i).padStart(3,'0'),nickname:'Test '+i,status:i%10===0?'archived':'active'}));
 const sessions=paddles.flatMap(p=>Array.from({length:12},(_,j)=>({id:p.id+'s'+j,paddleId:p.id,start:`2026-01-${String(j+1).padStart(2,'0')}T10:00:00Z`,end:`2026-01-${String(j+1).padStart(2,'0')}T11:00:00Z`})));
 state=validate({paddles,sessions,usagePeriods:[],settings:{mainPaddleId:'p1'}});app.setState(state);document.getElementById('paddleSearch').value='';
 const t=performance.now();app.renderPaddles();const ms=performance.now()-t;const list=document.getElementById('paddleList');assert.equal(list.querySelectorAll('.paddle-accordion').length,30);assert.equal(list.querySelectorAll('.paddle-expanded>*').length,0);assert.match(list.textContent,/12h/);
 const card=list.querySelector('.paddle-accordion');const open=performance.now();card.open=true;card.dispatchEvent(new window.Event('toggle'));const openMs=performance.now()-open;assert.ok(card.querySelector('.paddle-expanded .paddle-section'));
 const again=card.querySelector('.paddle-expanded').innerHTML;card.dispatchEvent(new window.Event('toggle'));assert.equal(card.querySelector('.paddle-expanded').innerHTML,again);
 document.querySelector('.collection-pagination button').click();assert.equal(list.querySelectorAll('.paddle-accordion').length,60);assert.match(document.querySelector('.collection-pagination').textContent,new RegExp('Showing 60 of '+count));
 const search=document.getElementById('paddleSearch');search.value='Model '+String(count-1).padStart(3,'0');const q=performance.now();search.dispatchEvent(new window.Event('input'));const searchMs=performance.now()-q;assert.equal(list.querySelectorAll('.paddle-accordion').length,1);assert.equal(list.querySelector('.paddle-accordion').dataset.paddle,'p'+(count-1));search.value='';search.dispatchEvent(new window.Event('input'));assert.equal(list.querySelectorAll('.paddle-accordion').length,30);
 app.renderMain();await tick();assert.ok(document.querySelector('.home-name-picker .searchable-paddle-select'));assert.equal(document.querySelector('.home-name-picker .searchable-paddle-select summary').textContent.includes('Test 1'),true);
 console.log(JSON.stringify({paddles:count,sessions:sessions.length,initialCards:30,initialRenderMs:+ms.toFixed(1),openDetailsMs:+openMs.toFixed(1),searchMs:+searchMs.toFixed(1)}));
}
await window.happyDOM.abort();console.log('PASS: synthetic 100/250/500 libraries, 1200/3000/6000 sessions, bounded initial rendering, lazy details once, Load more, all-library search/reset and searchable Home. No production writes.');
