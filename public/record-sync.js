const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const collections=['paddles','sessions','usagePeriods'];
const safe=k=>typeof k==='string'&&!['__proto__','prototype','constructor'].includes(k);
function delta(before,after){const upsert=[],remove=[];const b=new Map(before.map(x=>[x.id,x])),a=new Map(after.map(x=>[x.id,x]));for(const [id,value] of a){const old=b.get(id)??{},fields={},unset=[];for(const key of Object.keys(value))if(!equal(value[key],old[key]))fields[key]=value[key];for(const key of Object.keys(old))if(!(key in value))unset.push(key);if(Object.keys(fields).length||unset.length)upsert.push({id,fields,unset});}for(const id of b.keys())if(!a.has(id))remove.push(id);return {upsert,remove};}
export function buildChanges(before,after){
 const out={version:1,expenseSchema:1,importSchema:1};
 for(const key of collections){const values=s=>s[key].map(x=>{const p={...x};if(key==='paddles')delete p.maintenance;return p;});const d=delta(values(before),values(after));if(d.upsert.length||d.remove.length)out[key]=d;}
 const history=s=>s.paddles.flatMap(p=>(p.maintenance??[]).map(e=>({id:JSON.stringify([p.id,e.id]),paddleId:p.id,event:e})));
 const m=delta(history(before),history(after));if(m.upsert.length||m.remove.length)out.maintenance=m;
 for(const key of ['settings','catalog'])if(!equal(before[key],after[key]))out[key]=after[key];
 return out;
}
export function applyChanges(base,changes){
 if(!changes||changes.version!==1||Object.keys(changes).some(k=>!['version','expenseSchema','importSchema',...collections,'maintenance','settings','catalog'].includes(k)))throw Error('Invalid record changes');const state=structuredClone(base);
 function patch(rows,d){if(!d||Object.keys(d).some(k=>!['upsert','remove'].includes(k))||!Array.isArray(d.upsert)||!Array.isArray(d.remove)||d.upsert.length+d.remove.length>20000)throw Error('Invalid record patch');const map=new Map(rows.map(x=>[x.id,x])),seen=new Set();for(const id of d.remove){if(typeof id!=='string'||seen.has(id))throw Error('Invalid deletion');seen.add(id);map.delete(id);}for(const entry of d.upsert){if(!entry||typeof entry.id!=='string'||seen.has(entry.id)||!entry.fields||typeof entry.fields!=='object'||Array.isArray(entry.fields)||!Array.isArray(entry.unset)||Object.keys(entry.fields).some(k=>!safe(k))||entry.unset.some(k=>!safe(k)||k==='id')||entry.fields.id!=null&&entry.fields.id!==entry.id)throw Error('Invalid record update');seen.add(entry.id);const row={...map.get(entry.id),...entry.fields,id:entry.id};for(const key of entry.unset)delete row[key];map.set(entry.id,row);}return [...map.values()];}
 for(const key of collections)if(changes[key])state[key]=patch(state[key],changes[key]);
 if(changes.maintenance){const rows=state.paddles.flatMap(p=>(p.maintenance??[]).map(e=>({id:JSON.stringify([p.id,e.id]),paddleId:p.id,event:e})));const updated=patch(rows,changes.maintenance);for(const r of updated){if(!r.event||r.id!==JSON.stringify([r.paddleId,r.event.id])||!state.paddles.some(p=>p.id===r.paddleId))throw Error('Invalid maintenance owner');}for(const p of state.paddles)p.maintenance=updated.filter(r=>r.paddleId===p.id).map(r=>r.event);}
 for(const key of ['settings','catalog'])if(Object.hasOwn(changes,key))state[key]=changes[key];return state;
}
export const hasChanges=changes=>Object.keys(changes).some(k=>!['version','expenseSchema','importSchema'].includes(k));
