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
let state=validate({version:2,paddles:[{id:'p',brand:'A',model:'B',overgripInstalledAt:'2026-01-01T00:00:00Z'}],sessions:[],usagePeriods:[],settings:{mainPaddleId:'p',overgripHoursPerLevel:4}}),revision=0;
let recoveryFixture=null,confirmAction=true,failState=false;
const rules=JSON.parse(fs.readFileSync('public/competition-data.json'));let failCatalog=true;const fetcher=async(url,options={})=>{if(url==='/api/library-health')return {ok:true,status:200,json:async()=>({paddles:state.paddles.length,sessions:state.sessions.length,maintenance:0,lifetimeHours:sessionUsage('p',state.sessions),revision,storage:'records'})};if(url==='/api/backups')return {ok:true,status:200,json:async()=>({copies:[{id:'000000000001.json',revision:1}]})};if(url.startsWith('/api/backups?id='))return {ok:true,status:200,json:async()=>({state:recoveryFixture,revision:1})};if(url==='/reference-catalog.json'){if(failCatalog)throw Error('Offline');return {ok:true,json:async()=>JSON.parse(fs.readFileSync('public/reference-catalog.json'))};}if(url==='/api/competition')return {ok:true,json:async()=>rules};if(['PUT','PATCH'].includes(options.method)){if(failState)throw Error('Offline');const body=JSON.parse(options.body);if(body.revision!==revision)return {ok:false,status:409,json:async()=>({error:'Conflict'})};state=validate(body.changes?applyChanges(state,body.changes):body.state);revision++;return {ok:true,status:200,json:async()=>({revision})};}return {ok:true,status:200,json:async()=>({state,revision,accountId:'account'})};};globalThis.fetch=fetcher;
const context=vm.createContext({SessionSegments,buildChanges,hasChanges,referenceComparisonMarkup,referenceSourcesMarkup,normalizeSharedCatalog,combinedCatalog,AbortSignal,createCatalogTools,completeOrder,reorderSubset,installTouchReorder,createAnalytics,createSetupTools,weightSummary,normalizeWeights,window,document:doc,localStorage:window.localStorage,crypto,structuredClone,Date,console,AbortController,setTimeout,clearTimeout,fetch:fetcher,createEquipment,maintenanceEvents,currentComponent,sessionUsage,estimateContribution,overgripWear,validate,mergeChanges,mergeCatalog,parseCatalog,findModelId,askConfirm:async()=>confirmAction,pendingPhoto:async()=>null,createBilling:()=>({refresh:async()=>{},useAccount(){}})});
let source=fs.readFileSync('public/app.js','utf8').replace(/^import .*;\n/gm,'');source=source.slice(0,source.lastIndexOf('  if(document.readyState'))+'globalThis.appTest={startTimer,switchActivePaddle,endTimer,activeTimer,load,init,loadSharedCatalog,openUsageForm,openEstimate,showDetail,openSessionForm,saveSession,deleteSession,editSession,setMain,editPaddle,savePaddle,captureDraft,resumeDraft};})();';vm.runInContext(source,context);context.appTest.init();for(let i=0;i<5;i++)await new Promise(r=>setTimeout(r,0));const app=context.appTest;
state.paddles.push(validate({version:2,paddles:[{id:'second',brand:'Other',model:'Second Paddle'}],sessions:[],usagePeriods:[]}).paddles[0]);await app.load();

{
const tick=()=>new Promise(r=>setTimeout(r,0));
const second=state.paddles.find(p=>p.id!=='p'&&p.status==='active');assert.ok(second);
await app.startTimer('p');let timer=app.activeTimer();const now=Date.now();timer.start=new Date(now-7200000).toISOString();timer.segments[0].start=timer.start;window.localStorage.setItem('paddleLog.activeSession.account',JSON.stringify(timer));
app.switchActivePaddle(second.id,new Date(now-3600000).toISOString());assert.equal(app.activeTimer().segments.length,2);
await app.load();assert.equal(app.activeTimer().paddleId,second.id);assert.equal(doc.querySelector('[data-switch-session-paddle]').value,second.id);
failState=true;await app.endTimer();const end=app.activeTimer().end;assert.ok(end);failState=false;await app.endTimer();const multi=state.sessions.find(s=>s.id===timer.id);assert.equal(multi.segments.length,2);assert.equal(multi.end,end);assert.ok(sessionUsage('p',[multi])>.99);assert.ok(sessionUsage(second.id,[multi])>.99);assert.match(doc.querySelector('#sessionList').innerHTML,/session-paddle-usage/);
app.editSession(multi.id);assert.equal(doc.querySelector('#sessionPaddle').disabled,true);assert.equal(doc.querySelectorAll('[data-segment-field="paddleId"]').length,2);
const before=JSON.stringify(multi.segments);doc.querySelector('#sessionNotes').value='Shared session';app.captureDraft('sessionForm');app.resumeDraft('sessionForm:'+multi.id);await app.saveSession({preventDefault(){}});assert.equal(JSON.stringify(state.sessions.find(s=>s.id===multi.id).segments),before);
app.editSession(multi.id);const firstEnd=doc.querySelector('[data-segment="0"][data-segment-field="end"]');firstEnd.value=new Date(now-5400000).toISOString().slice(0,23);firstEnd.dispatchEvent(new window.Event('change',{bubbles:true}));await app.saveSession({preventDefault(){}});assert.ok(Math.abs(sessionUsage('p',[state.sessions.find(s=>s.id===multi.id)])-.5)<.001);
await app.deleteSession(multi.id);assert.equal(state.sessions.some(s=>s.id===multi.id),false);
console.log('PASS: multi-paddle timer reload, failed save/retry, per-paddle history, metadata edit retaining exact timestamps, segment correction, deletion.');
}

await window.happyDOM.close();
