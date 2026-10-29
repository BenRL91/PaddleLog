import fs from 'node:fs';
import {normalizeSharedCatalog} from '../public/shared-catalog.js';
import {productName,customerVariant} from '../public/catalog-names.js';
export function auditVariants(catalog){
 const rows=normalizeSharedCatalog(catalog),groups=new Map();
 for(const row of rows){const key=row.brand.toLowerCase()+'|'+productName(row).toLowerCase();const group=groups.get(key)??[];group.push(row);groups.set(key,group);}
 const ambiguous=[];
 for(const [key,group]of groups){const labels=group.map(customerVariant);if(new Set(labels).size===labels.length)continue;
  ambiguous.push({key,brand:group[0].brand,product:productName(group[0]),customerVersions:group.filter(r=>r.referenceRecord.selection?.kind==='product').length,records:group.map(r=>({id:r.referenceModelId,model:r.model,modelNumber:r.modelNumber,version:customerVariant(r),sourceUrls:r.referenceRecord.sources.map(s=>s.url)})),status:group.some(r=>r.referenceRecord.selection?.kind==='product')?'Customer versions available; exact technical mappings retained separately':'Exact version mapping needs primary-source verification'});
 }
 return {checkedAt:'2026-10-05',totalRecords:rows.length,ambiguousFamilies:ambiguous,missingSurfaces:rows.filter(r=>!r.referenceRecord.specs?.faceMaterial||r.referenceRecord.specMetadata?.pendingVerificationFields?.includes('faceMaterial')).length};
}
const catalog=JSON.parse(fs.readFileSync('public/reference-catalog.json'));fs.writeFileSync('data/catalog-variant-audit.json',JSON.stringify(auditVariants(catalog),null,2)+'\n');console.log('Audited '+catalog.models.length+' records; '+auditVariants(catalog).ambiguousFamilies.length+' families with overlapping labels.');
