import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeSharedCatalog} from '../public/shared-catalog.js';
import {productName,customerVariant} from '../public/catalog-names.js';
import {surfaceInfo} from '../public/surface.js';
import {modelApproval} from '../public/competition.js';
const raw=JSON.parse(fs.readFileSync('public/reference-catalog.json')),report=JSON.parse(fs.readFileSync('data/catalog-gap-resolution.json')),rows=normalizeSharedCatalog(raw);
for(const [id,identity]of Object.entries(report.preservedIdentities)){const record=raw.models.find(r=>r.id===id);assert.ok(record);for(const key of Object.keys(identity))assert.deepEqual(record[key]??null,identity[key],id+' '+key);}
const j2=rows.filter(r=>productName(r)==='J2CR'&&r.referenceRecord.selection?.kind==='product');assert.equal(j2.length,4);assert.equal(new Set(j2.map(customerVariant)).size,4);assert.equal(j2.filter(r=>r.referenceRecord.selection.version.startsWith('Crystal Blue')).length,2);
for(const r of j2){assert.equal(r.thickness,16);assert.equal(r.referenceRecord.approvals.upaA,null);assert.equal(r.referenceRecord.approvals.usaPickleball,null);assert.ok(r.referenceRecord.sources.every(s=>s.type==='manufacturer'));}
const crystal=j2.find(r=>r.referenceRecord.selection.version.startsWith('Crystal Blue'));assert.match(surfaceInfo({brand:crystal.brand,model:crystal.model,modelId:crystal.referenceModelId},rows).label,/Crystal Blue/);
const coral=rows.find(r=>r.referenceRecord.selection?.kind==='product'&&productName(r)==='Coral Pro');assert.equal(surfaceInfo({brand:coral.brand,model:coral.model,modelId:coral.referenceModelId},rows).technology,'Double Diamond Tough');
const luxx=rows.filter(r=>r.referenceRecord.selection?.kind==='product'&&productName(r)==='LUXX Control Air');assert.equal(luxx.length,2);assert.ok(luxx.every(r=>r.thickness===19));
const now=Date.parse('2026-10-05'),policy={id:'approval',type:'approval',organizations:['USAP'],sourceUrl:'https://example.org',lastVerified:'2026-10-05'},ruleset={coverage:'complete',lastVerified:'2026-10-05',rules:[policy]};
assert.equal(modelApproval({brand:'Example',model:'Generic',thickness:16,modelId:'plref_mfr_example'},ruleset,{approvals:[{id:'x',catalogId:'plref_old',brand:'Example',model:'Generic',thicknessMm:16,organization:'USAP',status:'approved',sourceUrl:'https://example.org',lastVerified:'2026-10-05'}]},now).status,'NOT_VERIFIED');
console.log('PASS: preserved catalog identities and approvals, four distinct J2CR retail versions, durable technologies, 19 mm LUXX generation, and no inferred manufacturer approval.');
