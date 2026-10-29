import {findCatalogEntry} from './catalog.js';
import {compactBrand} from './catalog-names.js';
export function shapeCategory(value){
 const key=String(value??'').trim().toLowerCase().replace(/[\s_+-]/g,'');
 if(['wide','widebody','standard','traditional','square','aerostandardsquare'].includes(key))return 'Widebody';
 if(['elongated','invikta','elongatedplus'].includes(key))return 'Elongated';
 if(['hybrid','aerohybridplus','hylongated'].includes(key))return 'Hybrid';
 return key?'Other / custom':'Not recorded';
}
export function categoryReference(p,catalog){
 const direct=findCatalogEntry(catalog,p.brand,p.model,p.shape,p.thickness,p.modelId);if(direct)return direct;
 const norm=s=>String(s??'').trim().toLowerCase();
 const matches=catalog.filter(row=>norm(compactBrand(row.brand))===norm(compactBrand(p.brand))&&norm(row.model)===norm(p.model)&&(!p.thickness||!row.thickness||Number(p.thickness)===Number(row.thickness))&&(!p.shape||!row.shape||shapeCategory(p.shape)===shapeCategory(row.shape)));
 return matches.length===1?matches[0]:null;
}
export function paddleShapeCategory(p,catalog){
 const row=categoryReference(p,catalog),record=row?.referenceRecord;
 const manufacturer=row?.reference?.kind==='manufacturer'||record?.specMetadata?.basis==='manufacturer-published';
 if(manufacturer){
  if(shapeCategory(row.shape)==='Hybrid')return 'Hybrid';
  const held=record?.specMetadata?.pendingVerificationFields??[],spec=record?.specs??{};
  const length=held.includes('length')?null:spec.length,width=held.includes('width')?null:spec.width;
  // JohnKew dimensions overlap for unusually long/wide paddles; length takes precedence.
  if(Number.isFinite(length)&&length>=16.5)return 'Elongated';
  if(Number.isFinite(width)&&width>=8)return 'Widebody';
  if(Number.isFinite(length)&&length>=16.1&&length<=16.4)return 'Hybrid';
  const named=shapeCategory(row.shape);if(named!=='Not recorded'&&named!=='Other / custom')return named;
 }
 return shapeCategory(p.shape||row?.shape);
}
export function numericTier(value,low,high,labels=['Low','Medium','High']){if(value===''||value==null||!Number.isFinite(Number(value))||Number(value)<=0)return 'Not recorded';return Number(value)<low?labels[0]:Number(value)<high?labels[1]:labels[2];}
export function coreCategory(p,catalog){const row=categoryReference(p,catalog);const mm=row?.reference?.kind==='manufacturer'&&row.thickness?row.thickness:p.thickness||row?.thickness;if(mm==null||mm===''||!Number.isFinite(Number(mm))||Number(mm)<=0)return 'Not recorded';return Number(mm)<=14?'Thin (≤14 mm)':Number(mm)<16?'Medium (>14–<16 mm)':'Thick (≥16 mm)';}

export function paddleShapeMatches(p,catalog){const row=categoryReference(p,catalog);const named=row?.shape||p.shape;return /hylongated/i.test(named)?['Hybrid','Elongated']:[paddleShapeCategory(p,catalog)];}
