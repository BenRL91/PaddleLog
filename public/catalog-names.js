import {findCatalogEntry} from './catalog.js';
import {surfaceInfo} from './surface.js';
// Presentation only: IDs, source model names and approval evidence remain intact.
export function productName(row){
 let name=String(row.referenceRecord?.selection?.family??row.referenceRecord?.customerName??row.model??'').trim();
 name=name.replace(/Carbon Friction Surface/ig,'CFS').replace(/Carbon Abrasion Surface/ig,'CAS').replace(/\s+pickleball paddle$/i,'');
 name=name.replace(/\s*\(No MOI Clamps Allowed\)/ig,'').replace(/\s+\d+(?:\.\d+)?\s*mm\b/ig,'');
 if(/^Project Boomstik\b/i.test(name))name=name.replace(/^Project /i,'').replace(/\s+(Elongated|Widebody|Epic|Invikta)\b/ig,'');
 else if(row.shape)name=name.replace(new RegExp('\\s+'+String(row.shape).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i'),'');
 return name.trim()||row.model;
}
export function compactBrand(brand){
 const aliases={'honolulu pickleball company':'Honolulu','proton sports inc':'Proton','selkirk sport':'Selkirk','franklin sports':'Franklin'};
 return aliases[String(brand??'').trim().toLowerCase()]||brand;
}
export function compactShape(shape){return ({AeroHybridPlus:'Hybrid',AeroStandardSquare:'Square'})[shape]||shape;}
export function compactVersion(version){return String(version??'').replace('Crystal Blue (Blue Grit)','Crystal Blue').replace('Original (not Crystal Blue)','Original').replace(/ \(\d+(?:\.\d+)? mm generation\)/g,'').replace(/(\d+(?:\.\d+)?) in handle/g,'$1″ handle').replace('Exact retail version not confirmed','Version unconfirmed').replace('Surface / handle version not verified','Version unconfirmed');}
export function customerVariant(row){
 const mm=row.thickness||String(row.model).match(/\b(\d+(?:\.\d+)?)\s*mm\b/i)?.[1];
 const namedShape=String(row.model).match(/\b(Elongated|Widebody|Invikta|Epic|S2)\b/i)?.[1];
 const shape=compactShape(row.shape||namedShape)||'Shape not listed';
 const explicit=compactVersion(row.referenceRecord?.selection?.version);
 const info=surfaceInfo({brand:row.brand,model:row.model,modelId:row.referenceModelId},[row]);
 const texture=info.technology?info.label:/raw carbon/i.test(row.model)?'Raw Carbon':'';
 return [shape,mm?`${mm} mm`:'Thickness not listed',explicit||texture].filter(Boolean).join(' · ');
}
export function ownedPaddleLabel(p,rows=[]){
 const row=findCatalogEntry(rows,p.brand,p.model,p.shape,p.thickness,p.modelId);
 if(!row)return {title:p.nickname||p.model||p.brand||'Unnamed paddle',subtitle:[p.brand,p.nickname?p.model:null,p.shape,p.thickness?p.thickness+' mm':null].filter(Boolean).join(' · ')};
 const family=productName(row),selection=row.referenceRecord?.selection;
 const info=surfaceInfo(p,[row]);
 let version=compactVersion(selection?.version).split(' · ')[0];
 if(/^Series (Three|Four)\b/.test(version)||/unconfirmed|not verified/i.test(version))version='';
 if(!version&&info.technology)version=info.label;
 const title=family+(version&&!family.toLowerCase().includes(version.toLowerCase())?' · '+version:'');
 const shape=compactShape(p.shape||row.shape),handle=selection?.kind==='product'?row.referenceRecord?.specs?.handleLength:null;
 const subtitle=[compactBrand(p.brand),p.nickname?title:null,/^J[236]CR$/i.test(family)?null:shape,p.thickness?p.thickness+' mm':null,handle?handle+'″ handle':null].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · ');
 return {title:p.nickname||title,subtitle};
}
