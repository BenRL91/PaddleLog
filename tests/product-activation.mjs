import * as SessionSegments from '../public/session-segments.js';
import {buildChanges,hasChanges,applyChanges} from '../public/record-sync.js';
import {referenceComparisonMarkup,referenceSourcesMarkup} from '../public/reference-comparison.js';
import {normalizeSharedCatalog,combinedCatalog} from '../public/shared-catalog.js';
import {createCatalogTools} from '../public/catalog-ui.js';
import {completeOrder,reorderSubset,installTouchReorder} from '../public/reorder.js';
import {createAnalytics} from '../public/analytics-ui.js';
import {createSetupTools,weightSummary} from '../public/setup-tools.js';
import {normalizeWeights} from '../public/weight-math.js';
process.env.TZ='UTC';
import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {Window} from 'happy-dom';
import {createEquipment} from '../public/equipment-ui.js';import {maintenanceEvents,currentComponent,sessionUsage,estimateContribution} from '../public/maintenance.js';import {overgripWear} from '../public/overgrip.js';import {validate} from '../public/validate.js';import {mergeChanges,mergeCatalog,parseCatalog} from '../public/sync.js';import {findModelId} from '../public/catalog.js';
const window=new Window({url:'https://test.local'});window.document.write(fs.readFileSync('app/paddle.html','utf8').replace(/<script[\s\S]*?<\/script>/g,''));
const doc=window.document;Object.assign(globalThis,{window,document:doc,localStorage:window.localStorage,FormData:window.FormData});
let state=validate({version:2,paddles:[],sessions:[],usagePeriods:[],settings:{}}),revision=0;
let recoveryFixture=null,confirmAction=true,failState=false;
const rules=JSON.parse(fs.readFileSync('public/competition-data.json'));let failCatalog=true;const fetcher=async(url,options={})=>{if(url==='/api/library-health')return {ok:true,status:200,json:async()=>({paddles:state.paddles.length,sessions:state.sessions.length,maintenance:0,lifetimeHours:sessionUsage('p',state.sessions),revision,storage:'records'})};if(url==='/api/backups')return {ok:true,status:200,json:async()=>({copies:[{id:'000000000001.json',revision:1}]})};if(url.startsWith('/api/backups?id='))return {ok:true,status:200,json:async()=>({state:recoveryFixture,revision:1})};if(url==='/reference-catalog.json'){if(failCatalog)throw Error('Offline');return {ok:true,json:async()=>JSON.parse(fs.readFileSync('public/reference-catalog.json'))};}if(url==='/api/competition')return {ok:true,json:async()=>rules};if(['PUT','PATCH'].includes(options.method)){if(failState)throw Error('Offline');const body=JSON.parse(options.body);if(body.revision!==revision)return {ok:false,status:409,json:async()=>({error:'Conflict'})};state=validate(body.changes?applyChanges(state,body.changes):body.state);revision++;return {ok:true,status:200,json:async()=>({revision})};}return {ok:true,status:200,json:async()=>({state,revision,accountId:'account'})};};globalThis.fetch=fetcher;
const context=vm.createContext({SessionSegments,buildChanges,hasChanges,referenceComparisonMarkup,referenceSourcesMarkup,normalizeSharedCatalog,combinedCatalog,AbortSignal,createCatalogTools,completeOrder,reorderSubset,installTouchReorder,createAnalytics,createSetupTools,weightSummary,normalizeWeights,window,document:doc,localStorage:window.localStorage,crypto,structuredClone,Date,console,AbortController,setTimeout,clearTimeout,fetch:fetcher,createEquipment,maintenanceEvents,currentComponent,sessionUsage,estimateContribution,overgripWear,validate,mergeChanges,mergeCatalog,parseCatalog,findModelId,askConfirm:async()=>confirmAction,pendingPhoto:async()=>null,createBilling:()=>({refresh:async()=>{},useAccount(){}})});
let source=fs.readFileSync('public/app.js','utf8').replace(/^import .*;\n/gm,'');source=source.slice(0,source.lastIndexOf('  if(document.readyState'))+'globalThis.appTest={startTimer,endTimer,activeTimer,renderTimeline,timelineMarker,load,init,loadSharedCatalog,openUsageForm,openEstimate,showDetail,openSessionForm,saveSession,deleteSession,editSession,setMain,editPaddle,savePaddle,captureDraft,resumeDraft};})();';vm.runInContext(source,context);context.appTest.init();for(let i=0;i<5;i++)await new Promise(r=>setTimeout(r,0));const app=context.appTest;

failCatalog=false;await app.loadSharedCatalog();
assert.equal(doc.getElementById('firstUseGuide').hidden,false);assert.match(doc.getElementById('firstUseGuide').textContent,/Add my paddle/);
doc.querySelector('[data-action="add-paddle"]').click();assert.equal(doc.getElementById('paddleOptional').open,false);
const rows=normalizeSharedCatalog(JSON.parse(fs.readFileSync('public/reference-catalog.json'))),row=rows.find(r=>r.reference&&rows.filter(x=>x.brand===r.brand&&x.model===r.model).length===1);
doc.getElementById('brandSearch').value=row.brand;doc.getElementById('brandSearch').dispatchEvent(new window.Event('input'));assert.ok([...doc.getElementById('brandCatalog').options].slice(1).every(o=>o.value.toLowerCase().includes(row.brand.toLowerCase())));
doc.getElementById('brandCatalog').value=row.brand;doc.getElementById('brandCatalog').dispatchEvent(new window.Event('change'));doc.getElementById('modelCatalog').value=row.model;doc.getElementById('modelCatalog').dispatchEvent(new window.Event('change'));await new Promise(r=>setTimeout(r,0));
assert.equal(doc.getElementById('catalogModelId').value,row.referenceModelId);assert.equal(doc.getElementById('staticWeight').value,'');assert.equal(doc.getElementById('length').value,'');
await app.savePaddle({preventDefault(){}});assert.equal(state.paddles.length,1);assert.equal(state.paddles[0].modelId,row.referenceModelId);assert.equal(state.paddles[0].staticWeight,'');assert.equal(state.settings.mainPaddleId,state.paddles[0].id);assert.match(doc.getElementById('detailBody').textContent,/Your paddle is ready/);assert.match(doc.getElementById('detailBody').textContent,/Your paddle specs/);assert.ok(doc.querySelector('#detailBody [data-start-session]'));assert.equal(doc.querySelector('#detailBody [data-competition]'),null);
doc.querySelector('#detailModal [data-cancel]').click();await new Promise(r=>setTimeout(r,0));doc.querySelector('[data-add-paddle-main]').click();doc.getElementById('manualPaddle').click();assert.equal(doc.getElementById('paddleOptional').open,true);doc.getElementById('brand').value='Custom Brand';doc.getElementById('model').value='My Paddle';await app.savePaddle({preventDefault(){}});assert.equal(state.paddles.length,2);assert.equal(state.paddles[1].modelId,null);assert.match(doc.getElementById('detailBody').textContent,/manually entered paddle/);
const savedIds=state.paddles.map(p=>p.modelId);await app.load();assert.deepEqual(state.paddles.map(p=>p.modelId),savedIds);assert.equal(doc.getElementById('firstUseGuide').hidden,true);
// Favorite activation never changes accordion expansion; one header control only.
for(const expanded of [false,true]){
 const card=doc.querySelector('#paddleList details');const id=card.dataset.paddle;card.open=expanded;
 const star=card.querySelector('summary [data-action="favorite"]');assert.ok(star);assert.equal(card.querySelectorAll('[data-action="favorite"]').length,1);
 const prior=state.paddles.find(p=>p.id===id).favorite;const event=new window.MouseEvent('click',{bubbles:true,cancelable:true});star.dispatchEvent(event);
 assert.equal(event.defaultPrevented,true);
 for(let i=0;i<5;i++)await new Promise(r=>setTimeout(r,0));
 const updated=doc.querySelector(`#paddleList details[data-paddle="${id}"]`);assert.equal(updated.open,expanded);assert.equal(state.paddles.find(p=>p.id===id).favorite,!prior);
 assert.equal(updated.querySelector('[data-action="favorite"]').textContent,!prior?'★':'☆');assert.doesNotMatch(updated.textContent,/Maintenance history/);
}
// Explicit role selection leaves the unrelated main assignments intact.
const roleCard=doc.querySelector('#paddleList details');const roleId=roleCard.dataset.paddle;const generalBefore=state.settings.mainPaddleId;
roleCard.querySelector('[data-action="set-main"]').click();assert.ok(doc.querySelector('#mainRoleDialog').open);
assert.match(doc.querySelector('#mainRoleDialog').textContent,/Gender Doubles main/);
doc.querySelector('[data-role-choice="doubles"]').click();for(let i=0;i<5;i++)await new Promise(r=>setTimeout(r,0));
assert.equal(state.settings.doublesMainPaddleId,roleId);assert.equal(state.settings.mainPaddleId,generalBefore);assert.equal(doc.querySelector('#mainRoleDialog').open,false);
// Embedded Home details must not repeat the primary specs or session action.
const home=doc.getElementById('mainPaddleCard');
assert.equal([...home.querySelectorAll('h3')].filter(h=>h.textContent==='Your paddle specs').length,1);
assert.equal(home.querySelectorAll('[data-start-session]').length,1);
assert.equal(home.querySelector('.home-details > summary').textContent,'Details');
assert.equal(home.querySelectorAll('.feel-grid').length,1);
assert.equal(home.querySelector('.paddle-spec-summary .reference-sources'),null);
assert.ok(home.querySelector('.home-details').nextElementSibling.matches('.reference-sources'));
assert.equal(home.querySelector('.home-details .paddle-spec-summary'),null);
await app.showDetail(state.paddles[0].id);
assert.equal([...doc.getElementById('detailBody').querySelectorAll('h3')].filter(h=>h.textContent==='Your paddle specs').length,1);
assert.equal(doc.querySelectorAll('#detailBody [data-start-session]').length,1);
doc.getElementById('competitionRulesetSetting').value='ppa-pro';
doc.getElementById('settingsForm').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
for(let i=0;i<10;i++)await new Promise(r=>setTimeout(r,0));
assert.equal(state.settings.competitionRuleset,'ppa-pro');
await app.load();app.showDetail(state.paddles[0].id);
assert.equal(doc.getElementById('competitionRulesetSetting').value,'ppa-pro');
assert.match(doc.querySelector('#detailBody .model-approval-badges').textContent,/UPA-A✓ Model Approved/);
assert.equal(doc.querySelectorAll('#detailBody .competition-badge').length,2);
assert.ok(doc.querySelector('#detailBody .competition-approved')); 
assert.equal(doc.querySelectorAll('#detailBody [data-competition]').length,0);
assert.equal(doc.querySelectorAll('#detailBody button.competition-badge').length,0);
assert.match(doc.querySelector('#detailBody .model-approval-badges').textContent,/USAP/);
// Event markers carry distinct types and readable SVGs without changing history actions.
app.renderTimeline();
for(const event of doc.querySelectorAll('#timelineList .event')){assert.ok(event.dataset.eventType);assert.equal(event.querySelectorAll('.timeline-marker').length,1);assert.equal(event.querySelectorAll('.timeline-marker svg').length,1);}
for(const type of ['session','estimate','period','overgrip','edgeTape','skin','added','archived','sold','setup','measurement']){const holder=doc.createElement('div');holder.innerHTML=app.timelineMarker(type);assert.ok(holder.querySelector('svg'));assert.ok(holder.querySelector('[title]'));assert.match(holder.innerHTML,/aria-hidden="true"/);}
assert.notEqual(app.timelineMarker('session'),app.timelineMarker('skin'));
console.log('PASS: zero-library welcome, searched brand/model activation, no reference-to-measurement copy, saved confirmation, first Main, manual path, exact reference persistence, and reload.');for(let i=0;i<5;i++)await new Promise(r=>setTimeout(r,0));await window.happyDOM.close();
