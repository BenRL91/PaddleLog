import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {approvalBrand} from '../public/competition.js';
import {normalizeSharedCatalog} from '../public/shared-catalog.js';

const norm=v=>String(v??'').trim().toLowerCase();
const compatible=(m,a)=>approvalBrand(m.brand)===approvalBrand(a.brand)&&norm(m.model)===norm(a.model)&&
 (a.thicknessMm==null||m.thickness==null||Number(m.thickness)===Number(a.thicknessMm))&&
 (!a.modelNumber||!m.modelNumber||norm(a.modelNumber)===norm(m.modelNumber));
const exactVariant=(m,a)=>compatible(m,a)&&(m.thickness??null)===(a.thicknessMm??null)&&norm(m.modelNumber)===norm(a.modelNumber);

// Reconcile trusted list snapshots into reference models. Never touch account data.
export function reconcileApprovedCatalog(catalog,competition){
 const next=structuredClone(catalog),data=structuredClone(competition);
 normalizeSharedCatalog(next);
 const byId=new Map(next.models.map(m=>[m.id,m])),byName=new Map(),brands=new Map();
 const nameKey=m=>approvalBrand(m.brand)+'|'+norm(m.model);
 const index=m=>{const key=nameKey(m);if(!byName.has(key))byName.set(key,[]);byName.get(key).push(m);if(!brands.has(approvalBrand(m.brand)))brands.set(approvalBrand(m.brand),m.brand);};
 next.models.forEach(index);
 const report={snapshotDate:data.officialListUpdatedAt,originalModels:next.models.length,
  retainedFingerprints:Object.fromEntries(next.models.map(m=>[m.id,createHash('sha256').update(JSON.stringify(m)).digest('hex')])),
  approvalEvidenceFingerprint:createHash('sha256').update(JSON.stringify(data.approvals.map(({catalogIds,...evidence})=>evidence))).digest('hex'),
  added:[],ambiguous:[],incompatibleExistingLinks:[],organizations:[],vatic:{}};
 for(const org of ['USAP','UPA-A']){
  const list=data.officialLists?.find(l=>l.organization===org),rows=data.approvals.filter(a=>a.organization===org&&!a.removedFromSnapshotAt);
  if(!list?.complete||rows.length!==list.count||new Set(rows.map(a=>a.id)).size!==list.count)throw Error('Incomplete official snapshot: '+org);
  for(const a of rows){
   const source=new URL(a.sourceUrl);
   if(a.verificationState!=='verified'||source.protocol!=='https:'||source.hostname!==(org==='USAP'?'equipment.usapickleball.org':'upaa.unitedpickleball.com'))throw Error('Unverified official record: '+a.id);
   if(a.status!=='approved')continue;
   if(a.thicknessMm!=null&&(!Number.isFinite(a.thicknessMm)||a.thicknessMm<=0||a.thicknessMm>100))throw Error('Invalid official thickness: '+a.id);
   const linked=(a.catalogIds??[]).map(id=>byId.get(id)).filter(Boolean);
   for(const m of linked)if(!compatible(m,a))report.incompatibleExistingLinks.push({approvalId:a.id,referenceId:m.id,officialModel:a.model,catalogModel:m.model});
   let matches=linked.filter(m=>compatible(m,a));
   if(!matches.length)matches=(byName.get(nameKey(a))??[]).filter(m=>exactVariant(m,a));
   let model=matches.length===1?matches[0]:null;
   if(!model){
    if(matches.length>1)report.ambiguous.push({approvalId:a.id,candidates:matches.map(m=>m.id)});
    const brand=brands.get(approvalBrand(a.brand))??a.brand.trim();
    // An official row with missing thickness stays unspecified; never borrow another variant's value.
    const signature=JSON.stringify([approvalBrand(brand),norm(a.model),a.thicknessMm??null,norm(a.modelNumber)]);
    const id='plref_official_'+createHash('sha256').update(signature).digest('hex').slice(0,20);
    model=byId.get(id);
    if(!model){
     model={id,brand,model:a.model.trim(),modelNumber:a.modelNumber??null,shape:null,thickness:a.thicknessMm??null,specs:{},
      sources:[{type:'governing_body',organization:org,url:a.sourceUrl,retrieved:a.lastVerified}],
      dataQuality:'official-approval-list',officialApprovalIds:{[org]:[a.id]}};
     next.models.push(model);byId.set(id,model);index(model);
     report.added.push({referenceId:id,organization:org,approvalId:a.id,brand,model:model.model,thickness:model.thickness});
    }
   }
   // Preserve physical/reference identities, but retire incompatible automatic approval links.
   // The original mapping is retained in the audit report, not presented as positive evidence.
   a.catalogIds=[...new Set([...(a.catalogIds??[]).filter(id=>byId.has(id)&&compatible(byId.get(id),a)),model.id])];
   if(model.dataQuality==='official-approval-list'){
    model.officialApprovalIds??={};model.officialApprovalIds[org]=[...new Set([...(model.officialApprovalIds[org]??[]),a.id])];
    if(!model.sources.some(s=>s.url===a.sourceUrl))model.sources.push({type:'governing_body',organization:org,url:a.sourceUrl,retrieved:a.lastVerified});
   }
  }
  report.organizations.push({organization:org,officialRows:rows.length,approvedRows:rows.filter(a=>a.status==='approved').length,
   selectableRows:rows.filter(a=>a.status==='approved'&&(a.catalogIds??[]).some(id=>byId.has(id)&&compatible(byId.get(id),a))).length});
 }
 normalizeSharedCatalog(next);
 report.totalModels=next.models.length;report.brands=new Set(next.models.map(m=>m.brand)).size;
 const vatic=m=>approvalBrand(m.brand)==='vaticpro';
 report.vatic={before:catalog.models.filter(vatic).length,after:next.models.filter(vatic).length,
  officialRows:data.approvals.filter(a=>vatic(a)&&a.status==='approved').length};
 next.coverage={...next.coverage,records:report.totalModels,brands:report.brands,
  usaPickleball:'All approved entries in the complete USAP snapshot checked '+data.officialListUpdatedAt+' are represented in the selectable catalog.',
  upaA:'All approved entries in the complete UPA-A snapshot checked '+data.officialListUpdatedAt+' are represented in the selectable catalog.',
  important:'Snapshot coverage, not a fresh crawl or complete manufacturer specifications. Existing reference identities retained; unsupported cross-list aliases and unspecified variants are not guessed.'};
 return {catalog:next,competition:data,report};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const catalogPath='public/reference-catalog.json',approvalPath='public/competition-data.json';
 const result=reconcileApprovedCatalog(JSON.parse(fs.readFileSync(catalogPath)),JSON.parse(fs.readFileSync(approvalPath)));
 fs.writeFileSync('data/catalog-coverage-audit.json',JSON.stringify(result.report,null,2)+'\n');
 if(process.argv.includes('--apply')){fs.writeFileSync(catalogPath,JSON.stringify(result.catalog,null,2)+'\n');fs.writeFileSync(approvalPath,JSON.stringify(result.competition,null,2)+'\n');}
 console.log(JSON.stringify({applied:process.argv.includes('--apply'),before:result.report.originalModels,added:result.report.added.length,
  after:result.report.totalModels,brands:result.report.brands,vatic:result.report.vatic,coverage:result.report.organizations,
  incompatibleExistingLinks:result.report.incompatibleExistingLinks.length,ambiguous:result.report.ambiguous.length}));
}
