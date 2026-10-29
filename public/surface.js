import {findCatalogEntry} from './catalog.js';
export function supportsSkin(p){return /^(reload|pikkl)(?:\s|$)/i.test(String(p.brand??'').trim());}
export function surfaceInfo(p,rows=[]){
 const row=findCatalogEntry(rows,p.brand,p.model,p.shape,p.thickness,p.modelId),record=row?.referenceRecord;
 const held=record?.specMetadata?.pendingVerificationFields?.includes('faceMaterial');
 const raw=held?'':String(record?.specs?.faceMaterial??'').trim();
 if(!raw)return {label:'Not recorded',material:null,technology:null,raw:null};
 const carbon=/carbon|PT-700/i.test(raw),glass=/fiberglass|fiber\s*glass|glass\s*fiber/i.test(raw),aramid=/aramid|kevlar/i.test(raw);
 const material=carbon&&glass?'Hybrid (carbon / fiberglass)':carbon&&aramid?'Hybrid (carbon / aramid)':carbon?'Carbon fiber':glass?'Fiberglass':aramid?'Aramid fiber':null;
 const technology=/prospin\+\s*nextgen/i.test(raw)?'ProSpin+ NextGen Texture':/infini\s*grit/i.test(raw)?'InfiniGrit':/hex\s*grit/i.test(raw)?'HexGrit':/crystal\s*blue/i.test(raw)?'Crystal Blue Endurance Surface':/aero[- ]black/i.test(raw)?'Aero-Black':/grit\s*bite/i.test(raw)?'GritBite':/double\s*diamond\s*tough/i.test(raw)?'Double Diamond Tough':/diamond\s*tough/i.test(raw)?'Diamond Tough':/durable\s*grit/i.test(raw)?'Durable Grit':null;
 const label=technology==='Crystal Blue Endurance Surface'?'Crystal Blue Grit':technology==='ProSpin+ NextGen Texture'?'ProSpin+ NextGen':technology||material||raw;
 return {label,material,technology,raw};
}
