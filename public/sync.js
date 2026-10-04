import {catalogKey} from './catalog.js';
import {normalizeReference} from './weight-math.js';
const canonical=x=>x&&typeof x==='object'?(Array.isArray(x)?x.map(canonical):Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])]))):x;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export function mergeRecord(base,desired,latest,path='record'){
 if(equal(desired,base)||equal(desired,latest))return structuredClone(latest);
 if(equal(latest,base))return structuredClone(desired);
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
 if(object(base)&&object(desired)&&object(latest)){const out={};for(const key of new Set([...Object.keys(base),...Object.keys(desired),...Object.keys(latest)])){const value=mergeRecord(base[key],desired[key],latest[key],path+'.'+key);if(value!==undefined)out[key]=value;}return out;}
 if(['maintenance','items'].includes(path.split('.').at(-1))&&[base,desired,latest].every(x=>Array.isArray(x)&&x.every(r=>r&&typeof r.id==='string'))){if(path.split('.').at(-1)==='maintenance'){for(const kind of new Set([...base,...desired,...latest].map(x=>x.kind))){const b=base.filter(x=>x.kind===kind),a=desired.filter(x=>x.kind===kind),r=latest.filter(x=>x.kind===kind);if(!equal(a,b)&&!equal(r,b)&&!equal(a,r))throw Error('The same field changed in another tab ('+kind+' maintenance). Your draft is kept; review the installations before retrying.');}}const b=new Map(base.map(r=>[r.id,r])),a=new Map(desired.map(r=>[r.id,r])),r=new Map(latest.map(r=>[r.id,r]));return [...new Set([...r.keys(),...a.keys(),...b.keys()])].map(id=>mergeRecord(b.get(id),a.get(id),r.get(id),path+'.'+id)).filter(x=>x!==undefined);}
 throw new Error('The same field changed in another tab ('+path+'). Your draft is kept; review it before retrying.');
}
export function mergeChanges(base,desired,latest){
 const out=structuredClone(latest);
 for(const key of ['paddles','sessions','usagePeriods']){
  const before=new Map(base[key].map(x=>[x.id,x])), after=new Map(desired[key].map(x=>[x.id,x])), remote=new Map(latest[key].map(x=>[x.id,x]));
  for(const id of new Set([...before.keys(),...after.keys()])){
   const b=before.get(id),a=after.get(id),r=remote.get(id);if(equal(a,b)||equal(a,r))continue;
   if(!b){if(r)throw new Error('This entry was changed elsewhere. Your draft is kept; review the saved entry before retrying.');remote.set(id,a);continue;}
   if(!a){if(!equal(b,r))throw new Error('This entry changed elsewhere. Reload before deleting it.');remote.delete(id);continue;}
   if(!r)throw new Error('This entry was deleted elsewhere. Your draft is kept.');
   remote.set(id,mergeRecord(b,a,r));
  }out[key]=[...remote.values()];
 }
 const beforeSettings=base.settings??{mainPaddleId:null,overgripHoursPerLevel:4},afterSettings=desired.settings??{mainPaddleId:null,overgripHoursPerLevel:4},remoteSettings=latest.settings??{mainPaddleId:null,overgripHoursPerLevel:4};out.settings={...remoteSettings};
 for(const field of Object.keys(afterSettings)){if(equal(afterSettings[field],beforeSettings[field]))continue;if(!equal(remoteSettings[field],beforeSettings[field])&&!equal(remoteSettings[field],afterSettings[field]))throw new Error('Settings changed in another tab. Reload and try again.');out.settings[field]=afterSettings[field];}
 for(const key of ['mainPaddleId','singlesMainPaddleId','doublesMainPaddleId','mixedMainPaddleId'])if(out.settings[key]&&!out.paddles.some(p=>p.id===out.settings[key]))out.settings[key]=null;
 if(out.settings.paddleOrder)out.settings.paddleOrder=out.settings.paddleOrder.filter(id=>out.paddles.some(p=>p.id===id));
 if(out.settings.favoriteOrder)out.settings.favoriteOrder=out.settings.favoriteOrder.filter(id=>out.paddles.some(p=>p.id===id));
 if(!equal(base.catalog??[],desired.catalog??[])){const before=new Map((base.catalog??[]).map(r=>[catalogKey(r),r])),remote=new Map((latest.catalog??[]).map(r=>[catalogKey(r),r]));for(const row of desired.catalog??[]){const key=catalogKey(row),b=before.get(key),r=remote.get(key);if(equal(row,b))continue;if(r&&!equal(r,b)&&!equal(r,row))throw new Error('This catalog variant changed in another tab. Review the latest catalog before importing again.');remote.set(key,row);}out.catalog=mergeCatalog([...remote.values()]);}
 return out;
}
export function mergeCatalog(...lists){const entries=new Map();for(const item of lists.flat()){const key=catalogKey(item);entries.set(key,{...entries.get(key),...item});}return [...entries.values()].sort((a,b)=>a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model));}
export function parseCatalogReport(text){text=text.replace(/^\uFEFF/,'');
 let rows;if(text.trim().startsWith('[')||text.trim().startsWith('{')){const d=JSON.parse(text);rows=Array.isArray(d)?d:d.catalog;}else{
  const table=[];let row=[],cell='',quote=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(!quote&&(c===','||c==='\n')){row.push(cell.replace(/\r$/,''));cell='';if(c==='\n'){table.push(row);row=[];}}else cell+=c;}if(quote)throw new Error('Unclosed CSV quote.');row.push(cell.replace(/\r$/,''));table.push(row);const headers=table.shift().map(x=>x.trim().toLowerCase());if(!headers.includes('brand')||!headers.includes('model'))throw new Error('CSV needs brand and model columns.');rows=table.filter(r=>r.some(x=>x.trim())).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
 }
 if(!Array.isArray(rows)||!rows.length||rows.length>10000)throw new Error('Provide 1–10,000 catalog rows.');const seen=new Map();let duplicates=0;const items=[];for(const [index,r] of rows.entries()){if(!r||typeof r.brand!=='string'||typeof r.model!=='string'||!r.brand.trim()||!r.model.trim()||r.brand.length>200||r.model.length>200)throw new Error('Row '+(index+1)+': brand and model required (maximum 200 characters).');if(r.shape!=null&&(typeof r.shape!=='string'||r.shape.length>200))throw new Error('Shape must be text.');const thickness=r.thickness;if(thickness!=null&&thickness!==''&&(!['number','string'].includes(typeof thickness)||!Number.isFinite(Number(thickness))||Number(thickness)<=0||Number(thickness)>100))throw new Error('Thickness must be millimeters between 0 and 100.');const item={brand:r.brand.trim(),model:r.model.trim(),...(r.shape?.trim()?{shape:r.shape.trim()}:{}),...(thickness!=null&&thickness!==''?{thickness:Number(thickness)}:{}),...(r.reference?{reference:normalizeReference(r.reference)}:{})};const key=catalogKey(item),old=seen.get(key);if(old){const metadata=x=>({shape:String(x.shape??'').toLowerCase(),thickness:x.thickness??'',reference:x.reference??null});if(!equal(metadata(old),metadata(item)))throw new Error('Conflicting duplicate variant at row '+(index+1)+'. Keep one source record per variant.');duplicates++;continue;}seen.set(key,item);items.push(item);}return {items:mergeCatalog(items),duplicates,inputRows:rows.length};
}
export function parseCatalog(text){return parseCatalogReport(text).items;}
