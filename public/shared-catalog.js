import {specFields} from './weight-math.js';
import {catalogKey} from './catalog.js';
const norm=v=>String(v??'').trim().toLowerCase();
// Shared reference records never enter account state or the physical-paddle importer.
// Retain raw source records, including unverified approval claims, losslessly.
export function normalizeSharedCatalog(data){
 if(data?.schemaVersion!=='paddlelog.reference-catalog.v1'||!Array.isArray(data.models)||data.models.length>10000)throw Error('Unsupported shared catalog.');
 const ids=new Set();const rows=data.models.map(m=>{
  if(!m||typeof m.id!=='string'||!/^plref_[a-zA-Z0-9_-]+$/.test(m.id)||ids.has(m.id)||typeof m.brand!=='string'||!m.brand.trim()||typeof m.model!=='string'||!m.model.trim()||m.brand.length>200||m.model.length>200)throw Error('Invalid shared model identity.');ids.add(m.id);
  if(m.shape!=null&&typeof m.shape!=='string'||m.modelNumber!=null&&typeof m.modelNumber!=='string'||m.thickness!=null&&(!Number.isFinite(m.thickness)||m.thickness<=0||m.thickness>100))throw Error('Invalid shared variant.');
  const held=m.specMetadata?.pendingVerificationFields??[];if(!Array.isArray(held)||held.some(k=>typeof k!=='string'))throw Error('Invalid pending reference fields.');
  const values={};for(const key of Object.keys(specFields)){const value=m.specs?.[key==='staticWeight'?'staticWeightOz':key];if(value!=null&&!held.includes(key==='staticWeight'?'staticWeightOz':key)){if(!Number.isFinite(value)||value<0)throw Error('Invalid shared reference measurement.');values[key]=value;}}
  for(const key of ['staticWeightOzRange','swingWeightRange','twistWeightRange','widthRange','gripCircumferenceRange']){
   const range=m.specs?.[key];
   if(range!=null&&(!Number.isFinite(range.min)||!Number.isFinite(range.max)||range.min<=0||range.max<range.min))throw Error('Invalid shared reference range: '+key);
  }
  if(m.specMetadata?.tolerances&&Object.values(m.specMetadata.tolerances).some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid shared reference tolerance.');
  const source=m.sources?.find(s=>s.type==='manufacturer')??m.sources?.[0];
  if(!Array.isArray(m.sources)||m.sources.some(s=>!s||typeof s.url!=='string'||!/^https?:\/\//.test(s.url)||typeof s.organization!=='string'))throw Error('Invalid shared reference source.');
  return {brand:m.brand.trim(),model:m.model.trim(),shape:m.shape??'',thickness:m.thickness??'',modelNumber:m.modelNumber??'',referenceModelId:m.id,referenceRecord:structuredClone(m),...(Object.keys(values).length?{reference:{kind:source?.type==='manufacturer'?'manufacturer':'other',name:source?.organization??'Supplied reference',url:source?.url??'',asOf:source?.retrieved??'',values}}:{})};
 });return rows.sort((a,b)=>a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model)||a.modelNumber.localeCompare(b.modelNumber));
}
export function combinedCatalog(shared,personal=[]){
 // Personal source observations remain distinct; equivalent metadata-only rows
 // need not duplicate a shared dropdown option. No writes to either collection.
 const signatures=new Set(shared.map(r=>[norm(r.brand),norm(r.model),norm(r.shape),r.thickness===''?'':Number(r.thickness)].join('|')));
 const extras=personal.filter(r=>r.reference||!signatures.has([norm(r.brand),norm(r.model),norm(r.shape),r.thickness==null||r.thickness===''?'':Number(r.thickness)].join('|')));
 const keys=new Set();return [...shared,...extras].filter(r=>{const k=catalogKey(r);if(keys.has(k))return false;keys.add(k);return true;});
}
