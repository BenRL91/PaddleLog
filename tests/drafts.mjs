import * as SessionSegments from '../public/session-segments.js';
import {buildChanges,hasChanges,applyChanges} from '../public/record-sync.js';
import {referenceComparisonMarkup,referenceSourcesMarkup} from '../public/reference-comparison.js';
import {normalizeSharedCatalog,combinedCatalog} from '../public/shared-catalog.js';
import {createCatalogTools} from '../public/catalog-ui.js';
import {completeOrder,reorderSubset,installTouchReorder} from '../public/reorder.js';
import {createAnalytics} from '../public/analytics-ui.js';
import {createSetupTools,weightSummary} from '../public/setup-tools.js';
import {normalizeWeights} from '../public/weight-math.js';
import {maintenanceEvents,currentComponent,sessionUsage,estimateContribution} from '../public/maintenance.js';
import {overgripWear} from '../public/overgrip.js';
import {findModelId} from '../public/catalog.js';
// Unit harness for application form logic; does not substitute for browser QA.
import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';import {validate} from '../public/validate.js';import {mergeChanges,mergeCatalog,parseCatalog} from '../public/sync.js';
const fields=['paddleId','brand','model','shape','nickname','status','length','width','thickness','serveSpeed','volleySpeed','twistWeight','swingWeight','sweetSpot','feelProfile','weightSetup','notes'];let failStorage=false;const memory=new Map();let server=validate({version:2,paddles:[],sessions:[],usagePeriods:[]}),revision=0,fail=false,ambiguous=false;
function harness(accountId){const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,{id,value:'',textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){}},insertAdjacentHTML(position,html){this.innerHTML+=html;},focus(){},addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];}});return elements.get(id);};get('paddleForm').querySelectorAll=()=>fields.map(get);get('paddleForm').reset=()=>fields.forEach(f=>get(f).value='');get('paddleModal').querySelector=q=>q==='form'?get('paddleForm'):null;
const context=vm.createContext({SessionSegments,buildChanges,hasChanges,referenceComparisonMarkup,referenceSourcesMarkup,normalizeSharedCatalog,combinedCatalog,AbortSignal,createCatalogTools,completeOrder,reorderSubset,installTouchReorder,createAnalytics,createSetupTools,weightSummary,normalizeWeights,maintenanceEvents,currentComponent,sessionUsage,estimateContribution,overgripWear,findModelId,pendingPhoto:async()=>null,validate,mergeChanges,mergeCatalog,parseCatalog,structuredClone,Date,console,AbortController,setTimeout,clearTimeout,crypto:{randomUUID:()=> 'draft-1'},localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>{if(failStorage)throw new Error('Quota exceeded');memory.set(k,v);},removeItem:k=>memory.delete(k)},document:{readyState:'loading',getElementById:get,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,body:{classList:{add(){},remove(){},toggle(){}}}},fetch:async(url,options={})=>{if(fail)throw new Error('Offline');if(['PUT','PATCH'].includes(options.method)){const d=JSON.parse(options.body);if(d.revision!==revision)return {ok:false,status:409,json:async()=>({error:'Conflict'})};server=validate(d.changes?applyChanges(server,d.changes):d.state);revision++;if(ambiguous){ambiguous=false;throw new Error('Response lost');}return {ok:true,status:200,json:async()=>({revision})};}return {ok:true,status:200,json:async()=>({state:structuredClone(server),revision,accountId,legacyOwner:false})};}});
let source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');source=source.replace('  if(document.readyState',`  globalThis.test={retryPending,getPending:()=>pendingSync,load,editPaddle,openPaddleForm,captureDraft,resumeDraft,savePaddle,closeModal,getDrafts:()=>drafts};\n  if(document.readyState`);vm.runInContext(source,context);return {api:context.test,get};}
let h=harness();await h.api.load();h.api.openPaddleForm();h.get('brand').value='Brand';h.get('model').value='Model';h.get('shape').value='Hybrid';h.get('notes').value='Never lose this';h.get('swingWeight').value='117.25';h.get('status').value='active';h.api.captureDraft('paddleForm');h.api.closeModal('paddleModal');assert.match(memory.get('paddleLog.drafts.v1'),/Never lose this/);
h=harness();await h.api.load();h.api.resumeDraft('paddleForm:draft-1');assert.equal(h.get('notes').value,'Never lose this');assert.equal(h.get('shape').value,'Hybrid');fail=true;await h.api.savePaddle({preventDefault(){}});assert.equal(h.get('notes').value,'Never lose this');assert.equal(Object.keys(h.api.getDrafts()).length,1);assert.equal(server.paddles.length,0);
fail=false;ambiguous=true;await h.api.savePaddle({preventDefault(){}});assert.equal(server.paddles.length,1);assert.equal(Object.keys(h.api.getDrafts()).length,1);await h.api.savePaddle({preventDefault(){}});assert.equal(server.paddles.length,1);assert.equal(server.paddles[0].notes,'Never lose this');assert.equal(Object.keys(h.api.getDrafts()).length,0);
console.log('PASS: close/reopen draft recovery, simulated page reload, failed network save keeps text, lost-response retry creates no duplicate, draft removed only after confirmed success.');

// New account-scoped draft keys never reveal another account's local entries.
h=harness('account-one');await h.api.load();h.api.openPaddleForm();h.get('brand').value='Private';h.get('model').value='One';h.api.captureDraft('paddleForm');
h=harness('account-two');await h.api.load();assert.equal(Object.keys(h.api.getDrafts()).length,0);
h=harness('account-one');await h.api.load();assert.equal(Object.keys(h.api.getDrafts()).length,1);
console.log('PASS: account-scoped local draft separation and recovery.');

h=harness('storage-test');await h.api.load();h.api.editPaddle('draft-1');h.get('brand').value='Brand';h.get('model').value='Storage failure';h.get('status').value='active';failStorage=true;assert.equal(h.api.captureDraft('paddleForm'),false);assert.match(h.get('paddleDraftStatus').textContent,/unavailable/);failStorage=false;h.api.captureDraft('paddleForm');const count=server.paddles.length;await Promise.all([h.api.savePaddle({preventDefault(){}}),h.api.savePaddle({preventDefault(){}})]);assert.equal(server.paddles.length,count);assert.equal(server.paddles.find(p=>p.id==='draft-1').model,'Storage failure');
console.log('PASS: local storage failure feedback and duplicate Save protection.');


h=harness('storage-test');await h.api.load();h.api.editPaddle('draft-1');h.get('notes').value='Recover pending save after reopening';fail=true;await h.api.savePaddle({preventDefault(){}});assert.ok(h.api.getPending());assert.match(memory.get('paddleLog.pendingSync.storage-test'),/Recover pending save after reopening/);fail=false;
h=harness('different-account');await h.api.load();assert.equal(h.api.getPending(),null);
h=harness('storage-test');await h.api.load();assert.ok(h.api.getPending());await h.api.retryPending();assert.equal(server.paddles.find(p=>p.id==='draft-1').notes,'Recover pending save after reopening');assert.equal(h.api.getPending(),null);assert.equal(memory.has('paddleLog.pendingSync.storage-test'),false);
console.log('PASS: complete pending save persists across restart, isolates accounts, and clears only after confirmed retry.');
