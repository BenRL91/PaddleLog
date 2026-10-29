import {currentComponent} from './maintenance.js';
export const eligibilityStatuses=['ELIGIBLE','NOT_ELIGIBLE','CONDITIONAL','NEEDS_VERIFICATION','UNKNOWN'];
export const reasonCodes=['MEASUREMENT_WITHIN_LIMIT','THICKNESS_NONCOMPLIANT','SKIN_CONFIGURATION_APPROVED','RULE_INFORMATION','ACCESSORY_TYPE_ALLOWED','WEIGHT_METHOD_ALLOWED','MODEL_APPROVAL_RECORDED','PADDLE_NOT_APPROVED','CERTIFICATION_REQUIRED','CERTIFICATION_EXPIRED','PADDLE_DELISTED','AFTERMARKET_SURFACE_NOT_ALLOWED','SKIN_NOT_APPROVED','SKIN_NOT_APPROVED_FOR_BASE_PADDLE','CROSS_BRAND_CONFIGURATION_NOT_ALLOWED','UNAPPROVED_MODIFICATION','WEIGHT_LIMIT_EXCEEDED','UNAPPROVED_WEIGHT_MODIFICATION','PADDLE_TOO_LONG','PADDLE_TOO_WIDE','COMBINED_DIMENSIONS_EXCEEDED','SURFACE_MODIFICATION_NOT_ALLOWED','SURFACE_CONDITION_NONCOMPLIANT','EVENT_TESTING_REQUIRED','INSUFFICIENT_DATA','RULES_NEED_VERIFICATION'];
const normalize=s=>String(s??'').trim().toLowerCase();
// Catalog identity is separate from an individual unit's measured dimensions.
export const approvalBrand=s=>{const n=normalize(s).replace(/[^a-z0-9]/g,'');return ({selkirksport:'selkirk',engagepickleball:'engage',franklinsports:'franklin',honolulupickleballcompany:'honolulu',breadandbutterpickleballcompany:'breadbutter',breadandbutter:'breadbutter',proxrpickleball:'proxr',rpmpickleball:'rpm'})[n]??n;};
const matchesModel=(a,p,key)=>a.id&&a.id===p.configuration?.approvalReferences?.[a.organization]?.id&&p.configuration.approvalReferences[a.organization].modelKey===key&&approvalBrand(a.brand)===approvalBrand(p.brand)?true:a.catalogIds?.includes(p.modelId)&&approvalBrand(a.brand)===approvalBrand(p.brand)&&normalize(a.model)===normalize(p.model)?true:a.catalogId?!!p.modelId&&a.catalogId===p.modelId&&normalize(a.brand)===normalize(p.brand)&&normalize(a.model)===normalize(p.model):a.modelKey===key;
export function modelKey(p){return [p.brand,p.model,p.shape,p.thickness].map(normalize).join('|');}
export function configurationKey(p,now=Date.now()){const skin=currentComponent(p,'skin',now);return JSON.stringify({model:modelKey(p),components:['overgrip','edgeTape','skin'].map(k=>{const e=currentComponent(p,k,now);return e?.action==='install'?{kind:k,id:e.id,at:e.at,manufacturer:e.manufacturer,product:e.product,variant:e.variant}:null;}),weightSetup:p.weightSetup??'',weightEntries:p.configuration?.weights?.items??[],modifications:p.configuration?.modifications??[]});}
export function physicalConfiguration(p,now=Date.now()) {const s=currentComponent(p,'skin',now);return {paddleId:p.id,modelKey:modelKey(p),skin:s?.action==='install'?s:null,crossBrand:s?.action==='install'&&!!s.manufacturer&&normalize(s.manufacturer)!==normalize(p.brand),modifications:p.configuration?.modifications??[],fingerprint:configurationKey(p,now)};}
// Only callers supplied by the authenticated, server-owned attestation feed may use this selector.
export function verifiedSpecs(p,data={},now=Date.now()){
 const fingerprint=physicalConfiguration(p,now).fingerprint,result={};
 const units={staticWeight:'oz',length:'in',width:'in',thickness:'mm',balancePoint:'cm',swingWeight:'kg·cm²',twistWeight:'kg·cm²'};
 for(const [field,unit] of Object.entries(units)){const m=(data.verifiedMeasurements??[]).filter(m=>m.paddleId===p.id&&m.configurationKey===fingerprint&&m.verifiedBy==='paddlelog'&&m.units?.[field]===unit&&typeof m.sourceUrl==='string'&&m.sourceUrl.startsWith('https://')&&Date.parse(m.at)<=now&&Number.isFinite(m.values?.[field])).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0];if(m)result[field]={value:m.values[field],at:m.at,sourceUrl:m.sourceUrl};}return result;
}

const fresh=(x,now,days=90)=>!!x?.lastVerified&&Number.isFinite(Date.parse(x.lastVerified))&&Date.parse(x.lastVerified)<=now&&now-Date.parse(x.lastVerified)<=days*86400000;
const active=(x,now)=>(!x.effectiveAt||Date.parse(x.effectiveAt)<=now)&&(!x.endsAt||Date.parse(x.endsAt)>now)&&(!x.expiresAt||Date.parse(x.expiresAt)>now)&&(!x.revokedAt||Date.parse(x.revokedAt)>now)&&!x.supersededBy;
export function approvalSnapshotHealth(data,now=Date.now()){
 const at=Date.parse(data.officialListUpdatedAt),days=data.approvalSnapshot?.reviewDays??30;
 if(!Number.isFinite(at)||at>now)return {fresh:false,message:'Approval snapshot date needs verification.'};
 const remaining=Math.max(0,Math.ceil((at+days*86400000-now)/86400000));
 return {fresh:now-at<=days*86400000,message:remaining?`Approval snapshot review due in ${remaining} day(s).`:'Approval snapshot review is due. Stale records cannot grant approval.'};
}
// List membership is independent of the unit's measurements and modifications.
export function modelApproval(p,ruleset,data={},now=Date.now()){
 const unknown=message=>({status:'NOT_VERIFIED',message,records:[]});
 if(/\(version unconfirmed\)/i.test(p.model??''))return unknown('Identify the exact paddle version to check its approval.');
 if(!ruleset||ruleset.coverage==='unknown'||!active(ruleset,now)||!fresh(ruleset,now,ruleset.reviewDays??90))return unknown('This ruleset needs verification before model approval can be determined.');
 const policy=ruleset.rules?.find(r=>r.type==='approval');
 if(!policy?.sourceUrl||!policy.organizations?.length||!active(policy,now)||!fresh(policy,now,ruleset.reviewDays??90))return unknown('No current approval-list policy is available for this ruleset.');
 let candidates=[...(data.approvals??[]),...(data.modelRestrictions??[])].filter(a=>matchesModel(a,p,modelKey(p))&&policy.organizations.includes(a.organization));
 if(!candidates.length&&String(p.modelId??'').startsWith('plref_mfr_'))return unknown('Retail version identified. Confirm its exact official approval listing before relying on an approval badge.');
 if(!candidates.length){
  const exact=[...(data.approvals??[]),...(data.modelRestrictions??[])].filter(a=>(a.catalogId||a.id)&&approvalBrand(a.brand)===approvalBrand(p.brand)&&normalize(a.model)===normalize(p.model)&&p.thickness!==''&&p.thickness!=null&&a.thicknessMm!=null&&Number(p.thickness)===a.thicknessMm);
  if(new Set(exact.map(a=>a.catalogId??a.id)).size===1)candidates=exact.filter(a=>policy.organizations.includes(a.organization));
 }
 const brandRejection=(data.brandRestrictions??[]).find(a=>policy.organizations.length===1&&policy.organizations.includes(a.organization)&&approvalBrand(a.brand)===approvalBrand(p.brand)&&fresh(a,now,30)&&active(a,now));
 if(brandRejection)return {status:'UNAPPROVED',message:brandRejection.summary,records:[brandRejection]};
 const current=candidates.filter(a=>a.verificationState!=='importedClaim'&&a.sourceUrl&&fresh(a,now,30)&&!a.supersededBy&&(!a.effectiveAt||Date.parse(a.effectiveAt)<=now)).sort((a,b)=>Date.parse(b.observedAt??b.lastVerified)-Date.parse(a.observedAt??a.lastVerified)||Number(['delisted','notApproved','expired'].includes(b.status))-Number(['delisted','notApproved','expired'].includes(a.status)));
 const records=current.filter((a,i)=>current.findIndex(b=>b.organization===a.organization)===i);
 const approved=records.find(a=>a.status==='approved'&&active(a,now));
 if(approved)return {status:'APPROVED',message:`This model appears on the ${approved.organization} approved list checked ${approved.lastVerified}.`,records:[approved],conditions:approved.conditions??[]};
 const rejects=a=>['delisted','notApproved','expired'].includes(a.status)||(a.expiresAt&&Date.parse(a.expiresAt)<=now)||(a.revokedAt&&Date.parse(a.revokedAt)<=now);
 if(policy.organizations.every(org=>records.some(a=>a.organization===org&&rejects(a))))return {status:'UNAPPROVED',message:'Current official records reject, delist, or expire this model under every accepted approval path.',records};
 const variantCouldMatch=a=>a.thicknessMm==null||p.thickness===''||p.thickness==null||Number(p.thickness)===Number(a.thicknessMm);
 const named=(data.approvals??[]).filter(a=>variantCouldMatch(a)&&policy.organizations.includes(a.organization)&&approvalBrand(a.brand)===approvalBrand(p.brand)&&normalize(a.model)===normalize(p.model)&&a.sourceUrl&&fresh(a,now,30));
 if(named.length)return unknown(`${named.length} official listing(s) share this brand and model name, but the exact reference entry is not confirmed. Use Confirm exact official model to identify the variant; this is not an unapproved determination.`);
 // Absence is evidence only in a complete, fresh, integrity-checked official snapshot.
 // Keep ambiguous identity and unverified/stale candidate rows out of negative determinations.
 if(candidates.length)return unknown('Matching approval evidence needs verification before a determination can be made.');
 const loose=s=>normalize(s).replace(/[^a-z0-9]/g,'');
 if((data.approvals??[]).some(a=>variantCouldMatch(a)&&policy.organizations.includes(a.organization)&&approvalBrand(a.brand)===approvalBrand(p.brand)&&loose(a.model)===loose(p.model)))return unknown('A similar official model name exists. Confirm the exact variant before determining approval.');
 const identified=normalize(p.brand)&&normalize(p.model)&&(normalize(p.modelId)||(normalize(p.shape)&&Number(p.thickness)>0&&Number.isFinite(Number(p.thickness))));
 const sourceBelongsToList=(source,list)=>{try{const entry=new URL(source),root=new URL(list);return entry.protocol==='https:'&&entry.origin===root.origin&&!entry.username&&!entry.password&&(entry.pathname===root.pathname||entry.pathname.startsWith(root.pathname.replace(/\/$/,'')+'/entry/'));}catch{return false;}};
 const lists=policy.organizations.map(org=>{
  const list=(data.officialLists??[]).find(l=>l.organization===org);
  const rows=(data.approvals??[]).filter(a=>a.organization===org);
  return list?.complete===true&&list.sourceUrl?.startsWith('https://')&&Number.isInteger(list.count)&&list.count>0&&rows.length===list.count&&new Set(rows.map(a=>a.id)).size===list.count&&rows.every(a=>a.id&&a.verificationState==='verified'&&sourceBelongsToList(a.sourceUrl,list.sourceUrl)&&fresh(a,now,data.approvalSnapshot?.reviewDays??30))?{...list,lastVerified:data.officialListUpdatedAt}:null;
 });
 if(identified&&approvalSnapshotHealth(data,now).fresh&&lists.every(Boolean))return {status:'UNAPPROVED',basis:'absentFromCompleteList',message:`This model is not listed in the complete ${policy.organizations.join(' or ')} approval snapshot checked ${data.officialListUpdatedAt}. Model-list status only; this is not a physical setup inspection.`,records:[],listEvidence:lists,lastVerified:data.officialListUpdatedAt};
 return unknown('Model approval cannot be confirmed: exact identity or a complete current official list is missing.');
}
export function evaluateCompetition(p,ruleset,data={},now=Date.now()){
 const config=physicalConfiguration(p,now),issues=[],measurements={};
 const add=(code,component,explanation,category='configuration',severity='verification',rule=null,extra={})=>{
  // Do not turn a professional specification into an amateur prohibition when official scope is ambiguous.
  if(rule?.applicability==='requiresConfirmation'&&['violation','verification'].includes(severity)){
   extra={...extra,candidateCode:code,supportingSources:[...(extra.supportingSources??[]),rule.applicabilitySourceUrl].filter(Boolean)};
   code='RULES_NEED_VERIFICATION';severity='verification';explanation='Under the referenced professional specification: '+explanation+' '+rule.applicabilityNote;
  }
  issues.push({code,component,explanation,category,severity,ruleId:rule?.id??null,sourceUrl:rule?.sourceUrl??ruleset?.sourceUrl??null,lastVerified:rule?.lastVerified??ruleset?.lastVerified??null,...extra});
 };
 const result=()=>({rulesetId:ruleset?.id??null,version:ruleset?.version??null,evaluatedAt:new Date(now).toISOString(),configuration:config,measurements,issues,violations:issues.filter(x=>x.severity==='violation'),warnings:issues.filter(x=>x.severity!=='violation'),status:issues.some(x=>x.severity==='violation')?'NOT_ELIGIBLE':issues.some(x=>x.severity==='verification')?'NEEDS_VERIFICATION':issues.some(x=>x.severity==='unknown')?'UNKNOWN':issues.some(x=>x.severity==='condition')?'CONDITIONAL':'ELIGIBLE'});
 if(!ruleset||ruleset.coverage==='unknown'){add('RULES_NEED_VERIFICATION','Ruleset','Equipment rules for this competition have not been verified.','rules','unknown');return result();}
 if(!active(ruleset,now)||!fresh(ruleset,now,ruleset.reviewDays??90)){add('RULES_NEED_VERIFICATION','Ruleset','Rules are stale, not yet effective, expired or superseded. Re-verify before using this result.','rules');return result();}
 if(!['complete','recordedConfiguration'].includes(ruleset.coverage))add('RULES_NEED_VERIFICATION','Ruleset','Only the listed requirements have been verified. Other equipment and event requirements remain unchecked.','rules');
 for(const conflict of ruleset.conflicts??[])add('RULES_NEED_VERIFICATION','Conflicting official guidance',conflict.summary,'rules','verification',conflict);
 const rules=(ruleset.rules??[]).filter(r=>{if(!['approval','limit','range','skin','eventTesting','modification','guidance','accessories','weightPlacement','inspection'].includes(r.type)||!r.id||!r.sourceUrl||r.type==='limit'&&(!Number.isFinite(r.maximum)||r.maximum<0||!['length','width','staticWeight','combined','thickness'].includes(r.field))||r.type==='approval'&&(!Array.isArray(r.organizations)||!r.organizations.length)){add('RULES_NEED_VERIFICATION','Ruleset','Rule definition is incomplete or unsupported.','rules');return false;}if(!active(r,now)||!fresh(r,now,ruleset.reviewDays??90)){add('RULES_NEED_VERIFICATION',r.id,'This individual rule needs verification.','rules','verification',r);return false;}return true;});
 const approvalRule=rules.find(r=>r.type==='approval');if(!approvalRule)add('RULES_NEED_VERIFICATION','Base paddle','No verified model-approval policy is available.','model');
 if(approvalRule){
  const candidates=[...(data.approvals??[]),...(data.modelRestrictions??[])].filter(a=>matchesModel(a,p,config.modelKey)&&approvalRule.organizations.includes(a.organization));
  const listing=modelApproval(p,ruleset,data,now);
  const records=listing.records;
  const valid=records.find(a=>a.status==='approved'&&active(a,now)&&(!a.expiresAt||Date.parse(a.expiresAt)>now));
  if(valid&&valid.organization==='UPA-A'&&ruleset.competitionLevel==='professional'&&valid.blackoutMetadataVerified===false)add('INSUFFICIENT_DATA','Base paddle finish','This exact model is on the UPA-A list, but its Blackout Only indicator and your physical paddle finish have not been verified.','model','verification',approvalRule,{evidence:valid});
  if(valid)add('MODEL_APPROVAL_RECORDED','Base paddle','A current authoritative listing was matched to this exact reference model. Configuration and physical checks remain separate.','model','information',approvalRule,{evidence:valid,sourceUrl:valid.sourceUrl,lastVerified:valid.lastVerified});
  else if(candidates.some(a=>a.verificationState==='importedClaim'))add('INSUFFICIENT_DATA','Imported approval claim','An imported listing claim exists, but it has not been independently checked against the current official list.','model','verification',approvalRule);
  if(!valid){const rejected=records.find(a=>['delisted','notApproved','expired'].includes(a.status)||a.revokedAt&&Date.parse(a.revokedAt)<=now||a.expiresAt&&Date.parse(a.expiresAt)<=now);const complete=approvalRule.organizations.every(org=>records.some(a=>a.organization===org));if(listing.status==='UNAPPROVED'&&listing.basis==='absentFromCompleteList')add('PADDLE_NOT_APPROVED','Base paddle',listing.message,'model','violation',approvalRule,{listEvidence:listing.listEvidence,lastVerified:listing.lastVerified});else if(rejected&&complete)add(rejected.status==='delisted'||rejected.revokedAt&&Date.parse(rejected.revokedAt)<=now?'PADDLE_DELISTED':rejected.status==='expired'||rejected.expiresAt&&Date.parse(rejected.expiresAt)<=now?'CERTIFICATION_EXPIRED':'PADDLE_NOT_APPROVED','Base paddle','An authoritative approval record does not permit this model under the required approval path.','model','violation',approvalRule,{evidence:rejected});else add('CERTIFICATION_REQUIRED','Base paddle','No current authoritative approval record is available for this exact model/variant. Absence here is not proof of rejection.','model','verification',approvalRule);}
 }
 for(const field of ['staticWeight','length','width','thickness']){
  const trusted=(data.verifiedMeasurements??[]).filter(m=>m.paddleId===p.id&&m.configurationKey===config.fingerprint&&m.verifiedBy==='paddlelog'&&m.units?.[field]===(field==='staticWeight'?'oz':field==='thickness'?'mm':'in')&&m.sourceUrl&&Date.parse(m.at)<=now&&Number.isFinite(m.values?.[field])).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0];
  measurements[field]=trusted?{value:trusted.values[field],source:'PaddleLog Verified Specs',at:trusted.at}:p[field]!==''&&p[field]!=null&&Number.isFinite(Number(p[field]))?{value:Number(p[field]),source:'User-entered'}:null;
 }
 const weights=p.configuration?.weights;
 if(weights?.items?.length&&Number.isFinite(weights.base?.grams)){const value=(weights.base.grams+weights.items.reduce((sum,w)=>sum+w.grams,0))/28.349523125;measurements.staticWeight={value,source:'Calculated from recorded baseline plus added weights'};}
 for(const r of rules){
  if(r.type==='limit'){
   const fields=r.field==='combined'?['length','width']:[r.field];
   if(fields.some(f=>!measurements[f])){add('INSUFFICIENT_DATA','Dimensions / weight','Enter '+fields.join(' and ')+' to evaluate this limit.','physical','verification',r);continue;}
   const value=fields.reduce((sum,f)=>sum+measurements[f].value,0);
   if(value>r.maximum+1e-9)add(r.code,'Dimensions / weight',`${value} ${r.unit} recorded; maximum ${r.maximum} ${r.unit}; over by ${Number((value-r.maximum).toFixed(4))} ${r.unit}.`,'physical','violation',r,{recorded:value,maximum:r.maximum,overBy:value-r.maximum,provenance:fields.map(f=>measurements[f].source)});
   else add('MEASUREMENT_WITHIN_LIMIT','Dimensions / weight',`${value} ${r.unit} recorded; maximum ${r.maximum} ${r.unit}.`,'physical','information',r,{recorded:value,maximum:r.maximum,provenance:fields.map(f=>measurements[f].source)});
  }
  if(r.type==='skin'&&config.skin){
   const skin=config.skin;
   const match=(data.configurationApprovals??[]).find(a=>(matchesModel(a,p,config.modelKey)||(a.baseApprovalId&&modelApproval(p,ruleset,data,now).records.some(v=>v.id===a.baseApprovalId&&v.status==='approved')))&&a.verificationState!=='importedClaim'&&a.rulesetId===ruleset.id&&a.rulesetVersion===ruleset.version&&normalize(a.manufacturer)===normalize(skin.manufacturer)&&normalize(a.product)===normalize(skin.product)&&normalize(a.variant)===normalize(skin.variant)&&a.sourceUrl&&fresh(a,now,30)&&active(a,now));
   if(match?.status==='approved'){add('SKIN_CONFIGURATION_APPROVED',skin.product,'This exact replacement surface and base-model combination has supporting approval evidence.','configuration','information',r,{evidence:match,sourceUrl:match.sourceUrl,supportingSources:[match.productSourceUrl,match.ruleSourceUrl].filter(Boolean)});continue;}
   if(match?.status==='prohibited')add('SKIN_NOT_APPROVED',skin.product,'This exact skin and paddle combination has a recorded prohibition.','configuration','violation',r,{removableComponent:'skin',evidence:match});
   else if(config.crossBrand&&r.crossBrand==='prohibited')add('CROSS_BRAND_CONFIGURATION_NOT_ALLOWED',skin.product,'This ruleset explicitly prohibits this cross-brand surface configuration.','configuration','violation',r,{removableComponent:'skin'});
   else if(r.policy==='prohibited'||(ruleset.organization==='USAP'&&approvalBrand(p.brand)!=='pikkl'&&(data.skinProducts??[]).some(x=>normalize(x.manufacturer)===normalize(skin.manufacturer)&&x.products.some(v=>normalize(v)===normalize(skin.product))&&x.classification==='aftermarketSurface'&&fresh(x,now,30))))add('AFTERMARKET_SURFACE_NOT_ALLOWED',skin.product,r.summary,'configuration','violation',r,{removableComponent:'skin'});
   else if(!(r.policy==='allowed'&&(!config.crossBrand||r.crossBrand==='allowed')))add('SKIN_NOT_APPROVED_FOR_BASE_PADDLE',skin.product,'Verification required: no current approval evidence for this exact base paddle + manufacturer + skin product + variant. Matching brands alone is insufficient.','configuration','verification',r);
  }
  if(r.type==='guidance')add('RULE_INFORMATION',r.component,r.summary,'physical','information',r);
  if(r.type==='range'){
   const m=measurements[r.field];
   if(!m)add('INSUFFICIENT_DATA','Thickness','Enter the configured hitting-area thickness to check the permitted range.','physical','verification',r);
   else if(m.value===r.maximum)add('RULES_NEED_VERIFICATION','Thickness','The summary and detailed thickness boundary differ at exactly 24 mm. Governing-body clarification is required.','physical','verification',r);
   else if(m.value<=r.minimum||m.value>r.maximum)add(r.code,'Thickness',`${m.value} ${r.unit} recorded; must be above ${r.minimum} and below ${r.maximum} ${r.unit}.`,'physical','violation',r);
   else add('MEASUREMENT_WITHIN_LIMIT','Thickness',`${m.value} ${r.unit} is within the recorded thickness range. Face variation still requires inspection.`,'physical','information',r);
  }
  if(r.type==='inspection')add('EVENT_TESTING_REQUIRED','Physical inspection',r.summary,'physical','condition',r);
  if(r.type==='accessories'){
   for(const kind of ['edgeTape','overgrip'])if(currentComponent(p,kind,now)?.action==='install')add('ACCESSORY_TYPE_ALLOWED',kind==='edgeTape'?'Edge tape':'Overgrip',r.summary,'configuration','information',r);
   if(p.configuration?.undergrip)add('ACCESSORY_TYPE_ALLOWED','Undergrip / grip insert',r.summary,'configuration','information',r);
  }
  if(r.type==='weightPlacement'){
   const items=p.configuration?.weights?.items??[];
   for(const item of items){
    const prohibited=r.policy==='upaa'&&((item.zone!=='butt'&&['slider','cap','coin'].includes(item.type))||item.type==='slider');
    if(prohibited)add('UNAPPROVED_WEIGHT_MODIFICATION',item.label||item.type,r.summary,'configuration','violation',r);
    else if(item.type==='other')add('INSUFFICIENT_DATA',item.label||'Added weight','The weight method is recorded as Other. Identify the construction and attachment method before determining compliance.','configuration','verification',r);
    else add('WEIGHT_METHOD_ALLOWED',item.label||item.type,r.summary+' Confirm secure installation and the overall configured measurements.','configuration','information',r);
   }
  }
  if(r.type==='eventTesting')add('EVENT_TESTING_REQUIRED','Individual paddle',r.summary,'physical','condition',r);
  if(r.type==='modification')for(const m of config.modifications.filter(m=>m.kind===r.kind))add(r.code??'UNAPPROVED_MODIFICATION',m.label??m.kind,r.summary,'configuration',r.policy==='prohibited'?'violation':'verification',r);
 }
 if(config.skin&&!rules.some(r=>r.type==='skin'))add('INSUFFICIENT_DATA',config.skin.product,'Skin modification policy has not been verified.');
 if(p.weightSetup?.trim()||config.modifications.some(m=>!(m.kind==='grip'&&rules.some(r=>r.type==='accessories'))&&!rules.some(r=>r.type==='modification'&&r.kind===m.kind)))add('INSUFFICIENT_DATA','Weight / other modifications','Recorded modifications need a review of material, method and placement. Free-text setup is not proof of compliance.');
 for(const kind of ['edgeTape','overgrip'])if(currentComponent(p,kind,now)?.action==='install')add('INSUFFICIENT_DATA',kind==='edgeTape'?'Edge tape':'Overgrip','The accessory type is permitted where indicated above; installation quality and placement must still meet the cited rules.','configuration','condition');
 return result();
}
export function removalImpact(p,ruleset,data,now=Date.now()){
 const before=evaluateCompetition(p,ruleset,data,now);if(!before.violations.some(v=>v.removableComponent==='skin'))return null;
 const copy=structuredClone(p);copy.maintenance=[...(p.maintenance??[]),{id:'zz-removal-preview',kind:'skin',action:'remove',at:new Date(now).toISOString()}];
 const after=evaluateCompetition(copy,ruleset,data,now);const resolved=before.violations.filter(v=>!after.violations.some(w=>w.code===v.code&&w.component===v.component)).length;
 return {resolved,remaining:after.violations.length,status:after.status,message:`Removing the skin would resolve ${resolved} of ${before.violations.length} known violations. Other verification requirements may remain.`};
}
