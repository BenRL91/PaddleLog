import {findCatalogEntry} from './catalog.js';
import {specFields} from './weight-math.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>v==null||v===''||!Number.isFinite(Number(v))?null:Number(v);
const fmt=v=>Number(v.toFixed(3)).toString();
const signed=v=>(v>0?'+':'')+fmt(v);
const ranges={staticWeight:'staticWeightOzRange',swingWeight:'swingWeightRange',twistWeight:'twistWeightRange',width:'widthRange'};
export function compareReference(p,rows){
 const row=findCatalogEntry(rows??[],p.brand,p.model,p.shape,p.thickness,p.modelId),ref=row?.reference;
 if(!ref)return {row,reference:null,measures:Object.entries(specFields).filter(([key])=>number(p[key])!=null).map(([key,label])=>({key,label,unit:number(p[key]),value:null,difference:'Reference not available'}))};
 const specs=row.referenceRecord?.specs??{},meta=row.referenceRecord?.specMetadata??{};
 const measures=Object.entries(specFields).map(([key,label])=>{
  const unit=number(p[key]),value=number(ref.values?.[key]??(key==='thickness'?row.thickness:null)),range=specs[ranges[key]],average=(meta.averageFields??[]).includes(key==='staticWeight'?'staticWeightOz':key),tolerance=meta.tolerances?.[key];
  if(value==null&&!range&&unit==null)return null;
  let difference='Record your unit to compare';
  if(unit!=null){if(range)difference=unit<range.min?signed(unit-range.min)+' below range':unit>range.max?signed(unit-range.max)+' above range':'Within published range';else difference=value==null?'Reference not available':signed(unit-value);}
  return {key,label,unit,value,range,average,tolerance,difference};
 }).filter(Boolean);
 return {row,reference:ref,measures};
}
export function homeSpecs(p,rows){
 const row=findCatalogEntry(rows??[],p.brand,p.model,p.shape,p.thickness,p.modelId),ref=row?.reference,meta=row?.referenceRecord?.specMetadata??{},specs=row?.referenceRecord?.specs??{};
 const manufacturer=ref?.kind==='manufacturer';
 return [['staticWeight','Static weight','oz'],['length','Length','in'],['width','Width','in'],['thickness','Thickness','mm'],['swingWeight','Swing weight','kg·cm²'],['twistWeight','Twist weight','kg·cm²'],['balancePoint','Balance Point','cm']].map(([key,label,units])=>{
  const mine=number(p[key]),held=(meta.pendingVerificationFields??[]).includes(key==='staticWeight'?'staticWeightOz':key);
  const value=held?null:number(ref?.values?.[key]),range=held?null:specs[ranges[key]],tolerance=number(meta.tolerances?.[key]??meta.tolerances?.[key==='staticWeight'?'staticWeightOz':key]);
  const low=range?.min??(value==null?null:value-(tolerance??0)),high=range?.max??(value==null?null:value+(tolerance??0));
  let comparison=null;if(mine!=null&&manufacturer&&low!=null&&high!=null){comparison=mine<low-1e-9?'below':mine>high+1e-9?'above':range||tolerance?'within':'matches';}
  return {key,label,units,mine,value,range,comparison,source:mine!=null?(p.configuration?.tuningLab?.appliedFields?.includes(key)&&number(p.configuration.tuningLab.estimates[key])===mine?'Tuning Lab estimate':'Your paddle'):manufacturer?'Manufacturer':'Reference',referenceLabel:range?fmt(range.min)+'–'+fmt(range.max):value!=null?fmt(value)+(tolerance?' ± '+fmt(tolerance):''):null};
 });
}
export function referenceComparisonMarkup(p,rows,includeSources=true){
 const specs=homeSpecs(p,rows),hasMine=specs.some(m=>m.mine!=null);
 return '<section class="paddle-spec-summary" aria-label="Paddle specifications"><h3>Your paddle specs</h3><div class="home-spec-grid">'+specs.map(m=>{
 const text=m.mine!=null?fmt(m.mine):m.referenceLabel??'Not recorded',icon={below:'↓',above:'↑',within:'↔',matches:'↔'}[m.comparison],description={below:'Below manufacturer specification',above:'Above manufacturer specification',within:'Within manufacturer specification',matches:'Matches manufacturer specification'}[m.comparison];
 return '<div class="home-spec"><span>'+esc(m.label)+'</span><strong>'+esc(text)+(text==='Not recorded'?'':' <small>'+esc(m.units)+'</small>')+(icon?' <span class="spec-indicator" role="img" aria-label="'+esc(description)+'" title="'+esc(description)+': '+esc(m.referenceLabel)+' '+esc(m.units)+'">'+icon+'</span>':'')+'</strong><small>'+esc(text==='Not recorded'?'Add a measurement':m.source)+'</small>'+'</div>';
 }).join('')+'</div>'+(hasMine?'<p class="small">↑ Above · ↓ Below · ↔ Matches manufacturer specs</p>':'')+(includeSources?referenceSourcesMarkup(p,rows):'')+'</section>';
}
function sourceMarkup(p,rows){const {row,reference:ref}=compareReference(p,rows);if(!ref)return '<p class="small">No exact reference specs available. You can enter your own measurements.</p>';const meta=row?.referenceRecord?.specMetadata;return '<p class="small">'+esc(ref.name)+' · '+esc(ref.kind)+' · '+(row?.referenceRecord?'Shared catalog':'Personal imported reference')+'<br>Checked '+esc(meta?.checkedAt??ref.asOf??'date not supplied')+'</p>'+(/^https?:\/\//i.test(ref.url??'')?'<a href="'+esc(ref.url)+'" target="_blank" rel="noopener">View source</a>':'')+'<p class="small">'+esc(meta?.configuration??'Reference and personal measurements may use different setups.')+' Older records may contain previously autofilled values; confirm these against your paddle.</p>'+Object.entries(ref.values??{}).map(([key,value])=>'<p class="small">'+esc(specFields[key]??key)+': '+esc(value)+'</p>').join('');}

export function referenceSourcesMarkup(p,rows){return '<details class="reference-sources"><summary>Reference sources</summary>'+sourceMarkup(p,rows)+'</details>';}
