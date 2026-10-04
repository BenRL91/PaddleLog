import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {normalizeSharedCatalog} from '../public/shared-catalog.js';

// Apply a reviewed, ID-bound batch. Never rename models or alter approval evidence.
export function enrichCatalog(catalog,batch){
  if(batch.schemaVersion!=='paddlelog.reference-enrichment.v1'||!Array.isArray(batch.items))throw Error('Invalid enrichment batch');
  const next=structuredClone(catalog),seen=new Set();
  for(const patch of batch.items){
    if(seen.has(patch.id))throw Error('Duplicate enrichment identity');seen.add(patch.id);
    const row=next.models.find(m=>m.id===patch.id);
    if(!row||row.brand!==patch.expectedBrand||row.model!==patch.expectedModel||row.modelNumber!==patch.expectedModelNumber)throw Error('Enrichment identity mismatch: '+patch.id);
    if(patch.source?.type!=='manufacturer'||!/^https:\/\//.test(patch.source.url)||patch.specMetadata?.sourceUrl!==patch.source.url||patch.specMetadata?.checkedAt!==patch.source.retrieved)throw Error('Missing source provenance');
    for(const field of ['shape','thickness']){
      if(row[field]!=null&&row[field]!==patch[field])throw Error('Conflicting variant '+patch.id+' '+field);
      row[field]=patch[field];
    }
    for(const [field,value] of Object.entries(patch.specs)){
      if(row.specs[field]!=null&&JSON.stringify(row.specs[field])!==JSON.stringify(value))throw Error('Conflicting reference '+patch.id+' '+field);
      row.specs[field]=structuredClone(value);
    }
    row.specMetadata=structuredClone(patch.specMetadata);
    if(!row.sources.some(s=>s.type===patch.source.type&&s.url===patch.source.url&&s.retrieved===patch.source.retrieved))row.sources.push(structuredClone(patch.source));
    row.dataQuality='manufacturer-specs-with-source';
  }
  next.enrichment={checkedAt:batch.checkedAt,records:batch.items.length,batch:'reference-enrichment-2026-10-02.json'};
  normalizeSharedCatalog(next);
  return next;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const file='public/reference-catalog.json',batch=JSON.parse(fs.readFileSync('data/reference-enrichment-2026-10-02.json'));
  const enriched=enrichCatalog(JSON.parse(fs.readFileSync(file)),batch);
  fs.writeFileSync(file,JSON.stringify(enriched,null,2)+'\n');
  console.log('Applied '+batch.items.length+' source-attributed manufacturer records.');
}
