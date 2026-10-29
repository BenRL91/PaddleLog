import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyCatalogImages} from '../scripts/apply-catalog-images.mjs';
import {normalizeSharedCatalog} from '../public/shared-catalog.js';
import {paddleImage} from '../public/paddle-image.js';
const raw=JSON.parse(fs.readFileSync('public/reference-catalog.json'));
const batch=JSON.parse(fs.readFileSync('data/catalog-images-2026-10-07.json'));
const next=applyCatalogImages(raw,batch);
const strip=data=>data.models.map(({image,...record})=>record);
assert.deepEqual(strip(next),strip(raw),'Images must not alter IDs, specs, approval evidence or selection variants.');
assert.deepEqual(next,raw,'Batch must be repeatable.');
const rows=normalizeSharedCatalog(next);
for(const item of batch.items){
 const row=next.models.find(m=>m.id===item.id);
 const paddle={brand:row.brand,model:row.model,shape:row.shape,thickness:row.thickness,modelId:row.id};
 assert.equal(paddleImage(paddle,rows).src,item.image.url);
 assert.equal(paddleImage({...paddle,photoId:'my-photo'},rows).src,'/api/photos?id=my-photo');
}
const corrupted=structuredClone(batch);corrupted.items[0].expectedModel='Wrong generation';
assert.throws(()=>applyCatalogImages(raw,corrupted),/identity mismatch/);
const duplicate=structuredClone(batch);duplicate.items.push(duplicate.items[0]);
assert.throws(()=>applyCatalogImages(raw,duplicate),/identity mismatch/);
const unsafe=structuredClone(batch);unsafe.items[0].image.url='javascript:alert(1)';
assert.throws(()=>applyCatalogImages(raw,unsafe),/provenance/);
const crbn=batch.items.filter(i=>i.expectedBrand==='CRBN'&&i.expectedModel.includes('TRUFOAM'));
for(const item of crbn){
 const number=item.expectedModel.match(/\b([1-4])\b/)[1];
 assert.ok(item.image.sourceUrl.endsWith(number),'CRBN shape number must match its exact manufacturer product.');
}
const crystal=batch.items.filter(i=>i.expectedModel.includes('Crystal Blue (Blue Grit)'));
assert.equal(crystal.length,4);
assert.ok(crystal.every(i=>i.image.sourceUrl.includes('crystal-blue')));
const additional=JSON.parse(fs.readFileSync('data/catalog-images-2026-10-08.json'));assert.deepEqual(applyCatalogImages(raw,additional),raw);for(const item of additional.items){assert.equal(paddleImage({modelId:item.id,brand:item.expectedBrand,model:item.expectedModel},rows).src,item.image.url);assert.ok(item.image.sourceUrl.startsWith('https://vaticpro.com/products/'));}
console.log('PASS: '+batch.items.length+' exact ID-bound image mappings, unchanged catalog identities/specs/approvals, upload precedence, safe repeat application, provenance, and generation/shape protections.');
