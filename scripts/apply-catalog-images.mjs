import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {normalizeSharedCatalog} from '../public/shared-catalog.js';

// Apply reviewed physical-product image mappings by stable reference ID only.
// Product-name matching is a research step, never a runtime fallback.
export function applyCatalogImages(catalog,batch){
 if(batch.schemaVersion!=='paddlelog.catalog-images.v1'||!Array.isArray(batch.items))throw Error('Invalid image batch');
 const next=structuredClone(catalog),seen=new Set();
 for(const item of batch.items){
  const row=next.models.find(m=>m.id===item.id);
  if(seen.has(item.id)||!row||row.brand!==item.expectedBrand||row.model!==item.expectedModel)throw Error('Image identity mismatch: '+item.id);
  seen.add(item.id);
  const image=item.image;
  if(image?.sourceType!=='manufacturer'||!/^https:\/\//.test(image.url)||!/^https:\/\//.test(image.originalUrl)||!/^https:\/\//.test(image.sourceUrl)||!image.credit||!image.checkedAt||!image.productTitle||!image.variantTitle)throw Error('Missing image provenance: '+item.id);
  if(image.validation?.decoded!==true)throw Error('Unverified image: '+item.id);
  row.image=structuredClone(image);
 }
 normalizeSharedCatalog(next);
 return next;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const path='public/reference-catalog.json';
 const batch=JSON.parse(fs.readFileSync(process.argv[2]??'data/catalog-images-2026-10-07.json'));
 const catalog=applyCatalogImages(JSON.parse(fs.readFileSync(path)),batch);
 fs.writeFileSync(path,JSON.stringify(catalog,null,2)+'\n');
 console.log('Applied '+batch.items.length+' verified manufacturer image mappings.');
}
