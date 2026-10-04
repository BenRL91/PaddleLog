import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Window} from 'happy-dom';
import {enrichCatalog} from '../scripts/enrich-reference-catalog.mjs';
import {normalizeSharedCatalog} from '../public/shared-catalog.js';
import {catalogKey} from '../public/catalog.js';
import {createCatalogTools} from '../public/catalog-ui.js';
const raw=JSON.parse(fs.readFileSync('public/reference-catalog.json'));
const batch=JSON.parse(fs.readFileSync('data/reference-enrichment-2026-10-02.json'));
// The October 2 fingerprint covers that batch's original seed, before later catalog additions.
const identity=raw.models.filter(m=>!m.id.startsWith('plref_official_')&&m.id!=='plref_ace4d7b32dce19ce').map(m=>Object.fromEntries(['id','brand','model','modelNumber','approvals'].map(k=>[k,m[k]])));
assert.equal(createHash('sha256').update(JSON.stringify(identity)).digest('hex'),batch.preservedIdentityApprovalSha256);
assert.deepEqual(enrichCatalog(raw,batch),raw); // Repeat is idempotent.
const wrong=structuredClone(batch);wrong.items[0].expectedModelNumber='Different';assert.throws(()=>enrichCatalog(raw,wrong),/identity mismatch/);
const conflict=structuredClone(batch);conflict.items[0].specs.length=17;assert.throws(()=>enrichCatalog(raw,conflict),/Conflicting reference/);
const duplicate=structuredClone(batch);duplicate.items.push(duplicate.items[0]);assert.throws(()=>enrichCatalog(raw,duplicate),/Duplicate/);
const missing=structuredClone(batch);missing.items[0].source.url='';assert.throws(()=>enrichCatalog(raw,missing),/provenance/);
const malformed=structuredClone(raw);malformed.models.find(m=>m.specs.staticWeightOzRange).specs.staticWeightOzRange={min:9,max:8};assert.throws(()=>normalizeSharedCatalog(malformed),/range/);
for(const field of ['swingWeightRange','twistWeightRange','widthRange','gripCircumferenceRange']){
 const bad=structuredClone(raw);bad.models[0].specs[field]={min:10,max:5};assert.throws(()=>normalizeSharedCatalog(bad),/range/);
}
const rows=normalizeSharedCatalog(raw),before=JSON.stringify(raw);
for(const suffix of ['5ded35e819d5ba7b','05ff2a21c2934374','e7a2e2c6f41f41d5']){
 const row=rows.find(r=>r.referenceModelId==='plref_'+suffix);assert.equal(row.reference.values.width,undefined);assert.ok(row.referenceRecord.specs.widthRange);assert.equal(row.reference.values.swingWeight,undefined);assert.equal(row.reference.values.twistWeight,undefined);assert.ok(row.referenceRecord.specs.swingWeight);
}
assert.equal(rows.find(r=>r.referenceModelId==='plref_31a4368d04f57e39').reference.values.swingWeight,undefined);

for(const p of batch.items){const r=rows.find(r=>r.referenceModelId===p.id);assert.equal(r.reference.kind,'manufacturer');assert.equal(r.reference.url,p.source.url);assert.equal(r.reference.asOf,p.source.retrieved);assert.equal(r.referenceRecord.specMetadata.sourceUrl,p.source.url);if(p.specs.staticWeightOzRange)assert.equal(r.reference.values.staticWeight,undefined);}
for(const id of ['plref_7f50aa7780d1b6f2','plref_564f2dca70430e2c','plref_d769d31525e308d6','plref_2be7e50d9532e0cc','plref_71a78611797a289f'])assert.equal(rows.find(r=>r.referenceModelId===id).reference,undefined);
const win=new Window({url:'https://test.local'});win.document.write(fs.readFileSync('app/paddle.html','utf8').replace(/<script[\s\S]*?<\/script>/g,''));const doc=win.document;
const tools=createCatalogTools({doc,getState:()=>({catalog:rows,paddles:[]}),confirm:async()=>true,onApplied(){},onDraft(){},saveCatalog:async()=>true});
for(const patch of batch.items){
 doc.getElementById('paddleForm').reset();doc.getElementById('catalogSearch').value='';doc.getElementById('brand').value=patch.expectedBrand;doc.getElementById('model').value=patch.expectedModel;doc.getElementById('notes').value='My unit notes';tools.refresh();
 const row=rows.find(r=>r.referenceModelId===patch.id);doc.getElementById('catalogVariant').value=catalogKey(row);doc.getElementById('catalogVariant').dispatchEvent(new win.Event('change'));await new Promise(r=>setTimeout(r,0));
 assert.equal(doc.getElementById('catalogModelId').value,patch.id);
 for(const [key,value] of Object.entries(row.reference.values))assert.equal(doc.getElementById(key).value,key==='thickness'?String(value):'');
 assert.equal(doc.getElementById('notes').value,'My unit notes');
 for(const [field,label] of [['swingWeight','swing weight'],['twistWeight','twist weight'],['width','width']])if(patch.specs[field+'Range']){
  assert.equal(doc.getElementById(field).value,'');assert.ok(doc.getElementById('catalogReference').textContent.includes('Manufacturer '+label+' range'));
 }

 if(patch.specs.staticWeightOzRange){assert.equal(doc.getElementById('staticWeight').value,'');assert.match(doc.getElementById('catalogReference').textContent,/Manufacturer weight range/);}
 assert.match(doc.getElementById('catalogReference').textContent,/Manufacturer specifications checked 2026-10-02/);
 assert.match(doc.getElementById('catalogReference').textContent,/not your physical unit/);
}
for(const id of ['plref_cef13b4604fb6ff2','plref_7f1863b5aa9d7a41','plref_e9db91e8a979720b','plref_0f68fb239046bd97','plref_ff69e2efda416c71'])assert.equal(rows.find(r=>r.referenceModelId===id).reference,undefined);
// Source-bound ranges never replace measurements entered by the owner.
doc.getElementById('paddleForm').reset();doc.getElementById('brand').value='11SIX24';doc.getElementById('model').value='Vapor Power 2';doc.getElementById('staticWeight').value='8.55';doc.getElementById('swingWeight').value='121';tools.refresh();
const vapor=rows.find(r=>r.referenceModelId==='plref_1fd46d30149e9bf1');doc.getElementById('catalogVariant').value=catalogKey(vapor);doc.getElementById('catalogVariant').dispatchEvent(new win.Event('change'));await new Promise(r=>setTimeout(r,0));assert.equal(doc.getElementById('staticWeight').value,'8.55');assert.equal(doc.getElementById('swingWeight').value,'121');
assert.equal(JSON.stringify(raw),before);await win.happyDOM.abort();
console.log('PASS: '+batch.items.length+' source-bound enrichments, stable identities/approvals, idempotence, conflict rejection, averages/ranges, unsafe configuration exclusions and actual autofill for every enriched variant.');
