import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const organizations=['USAP','UPA-A'];
const statuses=['approved','needsVerification','notApproved','delisted','expired'];
const day=value=>/^\d{4}-\d{2}-\d{2}$/.test(value??'')&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const official=(url,org)=>{try{const u=new URL(url);return u.protocol==='https:'&&u.hostname===(org==='USAP'?'equipment.usapickleball.org':'upaa.unitedpickleball.com');}catch{return false;}};
export function stageApprovalRefresh(current,candidate,now=Date.now()){
 if(!day(candidate.retrievedAt)||Date.parse(candidate.retrievedAt)>now||now-Date.parse(candidate.retrievedAt)>30*86400000)throw Error('Candidate retrieval date must be real, not future, and within 30 days.');
 if(current.officialListUpdatedAt&&candidate.retrievedAt<current.officialListUpdatedAt)throw Error('Cannot replace a newer snapshot with an older one.');
 if(!Array.isArray(candidate.records)||!Array.isArray(candidate.lists))throw Error('Complete lists and records required.');
 const seen=new Set();
 for(const a of candidate.records){
  if(!organizations.includes(a.organization)||typeof a.id!=='string'||!a.id||seen.has(a.id)||typeof a.brand!=='string'||!a.brand.trim()||typeof a.model!=='string'||!a.model.trim()||!statuses.includes(a.status)||!official(a.sourceUrl,a.organization)||a.verificationState!=='verified'||a.lastVerified!==candidate.retrievedAt)throw Error('Invalid, duplicate, unverified, or incorrectly dated approval record.');
  seen.add(a.id);
 }
 for(const org of organizations){
  const lists=candidate.lists.filter(x=>x.organization===org),records=candidate.records.filter(x=>x.organization===org);
  if(lists.length!==1||lists[0].complete!==true||!Number.isInteger(lists[0].count)||lists[0].count<1||lists[0].count!==records.length||!official(lists[0].sourceUrl,org))throw Error('Incomplete official list or count mismatch: '+org);
 }
 const old=new Map((current.approvals??[]).filter(a=>organizations.includes(a.organization)&&a.id).map(a=>[a.id,a]));
 const next=new Map(candidate.records.map(a=>[a.id,a]));
 const meaningful=a=>JSON.stringify([a.organization,a.brand,a.model,a.modelNumber??null,a.thicknessMm??null,a.status,a.conditions??[],a.expiresAt??null,a.revokedAt??null,a.blackoutMetadataVerified??null]);
 const added=[],removed=[],changed=[];
 for(const [id,a] of next){const prior=old.get(id);if(!prior)added.push({id,organization:a.organization,brand:a.brand,model:a.model});else if(meaningful(prior)!==meaningful(a))changed.push({id,before:prior,after:a});}
 for(const [id,a] of old)if(!next.has(id))removed.push(a);
 // Missing from a complete snapshot is not an official delisting claim.
 const withdrawn=removed.map(a=>({...a,status:['delisted','notApproved','expired'].includes(a.status)?a.status:'needsVerification',lastVerified:candidate.retrievedAt,observedAt:candidate.retrievedAt,removedFromSnapshotAt:candidate.retrievedAt,conditions:[...(a.conditions??[]),'Absent from the latest complete official snapshot. Confirm current status; absence alone does not establish official delisting.']}));
 const updated={...current,officialLists:candidate.lists,officialListUpdatedAt:candidate.retrievedAt,approvals:[...(current.approvals??[]).filter(a=>!organizations.includes(a.organization)),...candidate.records,...withdrawn],approvalSnapshot:{importedRecords:candidate.records.length,independentlyMatched:candidate.records.length,unverifiedClaims:withdrawn.filter(a=>a.status==='needsVerification').length,reviewDays:30}};
 const changes={retrievedAt:candidate.retrievedAt,previousAt:current.officialListUpdatedAt,added,removed,changed,counts:candidate.lists.map(x=>({organization:x.organization,count:x.count})),requiresReview:added.length+removed.length+changed.length>0};
 return {updated,changes};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const args=process.argv.slice(2),candidatePath=args[0];
  if(!candidatePath)throw Error('Usage: node scripts/refresh-approval-snapshot.mjs candidate.json [--apply]');
  const target='public/competition-data.json',current=JSON.parse(fs.readFileSync(target)),candidate=JSON.parse(fs.readFileSync(candidatePath));
  const {updated,changes}=stageApprovalRefresh(current,candidate);
  const base='data/approval-refresh-'+candidate.retrievedAt;
  fs.writeFileSync(base+'-changes.json',JSON.stringify(changes,null,2)+'\n');
  fs.writeFileSync(base+'-candidate.json',JSON.stringify(updated,null,2)+'\n');
  if(args.includes('--apply')){
   const backup=base+'-previous.json';if(!fs.existsSync(backup))fs.writeFileSync(backup,JSON.stringify(current,null,2)+'\n');
   fs.writeFileSync(target+'.tmp',JSON.stringify(updated,null,2)+'\n');fs.renameSync(target+'.tmp',target);
  }
  console.log(JSON.stringify({applied:args.includes('--apply'),added:changes.added.length,removed:changes.removed.length,changed:changes.changed.length,report:base+'-changes.json'}));
 }catch(e){console.error('Approval refresh aborted: '+e.message);process.exitCode=1;}
}
