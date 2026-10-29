import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Window} from 'happy-dom';
import {supportsSkin,surfaceInfo} from '../public/surface.js';
import {normalizeSharedCatalog} from '../public/shared-catalog.js';
import {createEquipment} from '../public/equipment-ui.js';
for(const brand of ['Reload',' reload ','PIKKL','PIKKL Pickleball'])assert.equal(supportsSkin({brand}),true);
for(const brand of ['JOOLA','Selkirk','Not PIKKL','Reloaded',''])assert.equal(supportsSkin({brand}),false);
const paddle={id:'p',brand:'Example',model:'Example',shape:'',thickness:16};
const row=raw=>[{brand:paddle.brand,model:paddle.model,thickness:16,referenceRecord:{specs:{faceMaterial:raw}}}];
for(const raw of ['T700 carbon fiber','3K woven raw carbon','Toray T700 Raw Carbon Fiber','18K Carbon'])assert.equal(surfaceInfo(paddle,row(raw)).label,'Carbon fiber');
assert.equal(surfaceInfo(paddle,row('fiberglass')).label,'Fiberglass');
assert.equal(surfaceInfo(paddle,row('Aramid fiber')).label,'Aramid fiber');
assert.equal(surfaceInfo(paddle,row('T700 Raw Carbon Fiber + fiberglass')).label,'Hybrid (carbon / fiberglass)');
assert.equal(surfaceInfo(paddle,[]).label,'Not recorded');
const held=row('HexGrit');held[0].referenceRecord.specMetadata={pendingVerificationFields:['faceMaterial']};assert.equal(surfaceInfo(paddle,held).label,'Not recorded');
const catalog=normalizeSharedCatalog(JSON.parse(fs.readFileSync('public/reference-catalog.json')));
const hex=catalog.find(r=>r.referenceRecord.specs.faceMaterial==='HexGrit');assert.match(surfaceInfo({...hex,modelId:hex.referenceModelId},catalog).label,/HexGrit/);
const durable=catalog.find(r=>r.referenceRecord.specs.faceMaterial==='Carbon fiber / Durable Grit');assert.match(surfaceInfo({...durable,modelId:durable.referenceModelId},catalog).label,/^Durable Grit$/);
for(const model of ['Project Boomstik Elongated 16mm','Project Boomstik Widebody 16mm']){const r=catalog.find(r=>r.model===model);assert.equal(surfaceInfo({...r,modelId:r.referenceModelId},catalog).label,'InfiniGrit');}
const window=new Window();Object.assign(globalThis,{window,document:window.document,localStorage:window.localStorage,FormData:window.FormData});
const state={paddles:[paddle],sessions:[],settings:{overgripHoursPerLevel:4}};
const ui=createEquipment({getState:()=>state,getAccount:()=>null,persist:async()=>true,confirm:async()=>true,getCatalog:()=>row('T700 carbon fiber')});
for(const brand of ['Reload','PIKKL']){const p={...paddle,brand};assert.match(ui.quickMaintenance(p),/data-maint="skin"/);assert.ok(!ui.compactWear(p).includes('surface-widget'));}
window.document.body.insertAdjacentHTML('beforeend',ui.quickMaintenance(paddle)+ui.compactWear(paddle));
assert.equal(document.querySelectorAll('[data-maint="skin"]').length,0);assert.equal(document.querySelectorAll('.surface-widget').length,2);
for(const widget of document.querySelectorAll('.surface-widget')){assert.match(widget.textContent,/Carbon fiber/);assert.match(widget.textContent,/Wear data pending/);assert.equal(widget.tagName,'SPAN');assert.ok(!widget.hasAttribute('data-maint'));}
await window.happyDOM.abort();console.log('PASS: skin brand gating, basic material grouping, hybrids, branded grit, unknown/held references and informational surface widgets with no wear calculations.');
