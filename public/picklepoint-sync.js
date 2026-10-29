// Versioned API transport around the unchanged Pickle Point v1 file contract.
import {parsePicklePoint,classifyRecord,importedId,buildImport,sourceKey,canonicalJSON} from './picklepoint-data.js';
export class PicklePointSyncError extends Error{constructor(code,message,status=409,sessionId=null){super(message);this.code=code;this.status=status;this.sessionId=sessionId;}}
const fail=(code,message,status=422,id=null)=>{throw new PicklePointSyncError(code,message,status,id);};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,keys)=>object(x)&&Object.keys(x).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x);
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(x);
export async function syncDigest(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalJSON(value)));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function normalizeSyncReceipts(rows){
 if(!Array.isArray(rows)||rows.length>20000)fail('INVALID_RECEIPTS','Invalid Pickle Point sync receipts.');const keys=new Set();
 return rows.map(r=>{if(!exact(r,['sourceInstanceId','sourceSessionId','revision','sourceDigest','referencesDigest','sessionId'])||!uuid(r.sourceInstanceId)||!id(r.sourceSessionId)||!id(r.sessionId)||!Number.isSafeInteger(r.revision)||r.revision<1||![r.sourceDigest,r.referencesDigest].every(x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x)))fail('INVALID_RECEIPTS','Invalid Pickle Point sync receipt.');const key=sourceKey(r.sourceInstanceId,r.sourceSessionId);if(keys.has(key))fail('INVALID_RECEIPTS','Duplicate Pickle Point sync receipt.');keys.add(key);return {...r};});
}
export function parseSyncRequest(body){
 if(!exact(body,['format','integrationVersion','operation','sessionExport','physicalPaddleReferences'])||body.format!=='leewaypb.paddlelog-session-sync'||body.integrationVersion!==1||body.operation!=='upsert')fail('UNSUPPORTED_SYNC_CONTRACT','Use integrationVersion 1 and the explicit upsert operation.',400);
 let parsed;try{parsed=parsePicklePoint(JSON.stringify(body.sessionExport));}catch(e){fail('INVALID_SOURCE_EXPORT',e.message,400);}
 if(parsed.invalid.length)fail('INVALID_SOURCE_SESSION',parsed.invalid.map(x=>'Session '+x.index+': '+x.message).join(' '));
 if(!parsed.records.length||parsed.records.length>50)fail('BATCH_LIMIT','Deliver between 1 and 50 completed sessions per request.');
 if(!Array.isArray(body.physicalPaddleReferences)||body.physicalPaddleReferences.length>10000)fail('INVALID_REFERENCES','Invalid physical paddle references.');
 const refs=new Map(),intervals=new Map();for(const r of parsed.records){if(r.source.timeBasis!=='recorded-play')fail('REQUIRES_MAPPING','Automatic sync requires recorded play intervals. Use file import to review elapsed or unknown time.',422,r.source.id);intervals.set(r.source.id,new Set(r.source.playIntervals.map(i=>i.id)));refs.set(r.source.id,new Map());}
 for(const r of body.physicalPaddleReferences){if(!exact(r,['sessionId','intervalId','physicalPaddleId'])||![r.sessionId,r.intervalId,r.physicalPaddleId].every(id)||!intervals.get(r.sessionId)?.has(r.intervalId)||refs.get(r.sessionId).has(r.intervalId))fail('INVALID_REFERENCES','References must identify exactly one known source interval and a physical paddle.');refs.get(r.sessionId).set(r.intervalId,r.physicalPaddleId);}
 for(const row of parsed.records)if(refs.get(row.source.id).size!==row.source.playIntervals.length)fail('REQUIRES_MAPPING','Every recorded interval needs its selected PaddleLog physicalPaddleId. Use file import for legacy mapping.',422,row.source.id);
 return {records:parsed.records,refs};
}
export async function reconcileSync(state,request,now=new Date().toISOString()){
 const receipts=new Map(normalizeSyncReceipts(state.settings.picklePointSyncReceipts??[]).map(r=>[sourceKey(r.sourceInstanceId,r.sourceSessionId),r]));
 const owned=new Set(state.paddles.map(p=>p.id)),decisions=new Map(),selected=[],results=[];let receiptChanged=false;
 for(const row of request.records){const physical=request.refs.get(row.source.id);for(const paddleId of physical.values())if(!owned.has(paddleId))fail('PADDLE_REFERENCE_REQUIRES_RESOLUTION','A physical paddle reference is unavailable in your PaddleLog library. No usage was attributed.',422,row.source.id);
  const r=classifyRecord(state,{...row,localId:await importedId(row.key)}),receipt=receipts.get(row.key),sourceDigest=await syncDigest(row.source),referencesDigest=await syncDigest([...physical].sort(([a],[b])=>a.localeCompare(b)));
  const latest=Math.max(receipt?.revision??0,r.existing?.picklePoint.snapshot.revision??0);
  if(row.source.revision<latest){results.push({sourceSessionId:row.source.id,status:'stale',revision:latest});continue;}
  if(receipt&&row.source.revision===receipt.revision&&(receipt.sourceDigest!==sourceDigest||receipt.referencesDigest!==referencesDigest))fail('REVISION_CONFLICT','The same revision has different source content or paddle references. Send a corrected higher source revision.',409,row.source.id);
  if(receipt&&!r.existing)fail('LOCAL_SESSION_REMOVED','This source session was previously received and has since been removed locally. Use the reviewed file importer to restore it.',409,row.source.id);
  if(receipt&&r.existing&&receipt.revision>r.existing.picklePoint.snapshot.revision)fail('SYNC_STATE_REQUIRES_REVIEW','Sync receipt and restored session revisions differ. Resolve through reviewed file import.',409,row.source.id);
  if(r.status==='conflict')fail('REVISION_CONFLICT',r.reason,409,row.source.id);
  if(r.status==='unchanged'){
   const expected=row.source.playIntervals.map(i=>({id:i.id,paddleId:physical.get(i.id),start:i.start,end:i.end}));
   if(canonicalJSON(expected)!==canonicalJSON(r.existing.picklePoint.applied.segments))fail('PADDLE_ASSIGNMENT_CONFLICT','The same source revision was already imported with different physical paddle assignments. Review mapping through file import.',409,row.source.id);
   results.push({sourceSessionId:row.source.id,paddleLogSessionId:r.existing.id,status:'unchanged',revision:row.source.revision,localEditsPreserved:!!r.localEdited});
  }else{
   if(r.localEdited)fail('LOCAL_EDITS_REQUIRE_REVIEW','This session has PaddleLog edits. Review the newer source revision through file import before replacing it.',409,row.source.id);
   if(!r.existing&&[...state.sessions,...state.paddles,...state.usagePeriods].some(x=>x.id===r.localId))fail('LOCAL_ID_CONFLICT','The prepared session ID is already used locally. No records were changed.',409,row.source.id);
   selected.push(r);decisions.set(r.key,{action:'replace',allowArchived:true,physicalPaddles:physical});
   results.push({sourceSessionId:row.source.id,paddleLogSessionId:r.existing?.id??r.localId,status:r.existing?'updated':'created',revision:row.source.revision});
  }
  const next={sourceInstanceId:row.instance,sourceSessionId:row.source.id,revision:row.source.revision,sourceDigest,referencesDigest,sessionId:r.existing?.id??r.localId};if(canonicalJSON(receipt)!==canonicalJSON(next)){receipts.set(row.key,next);receiptChanged=true;}
 }
 let next=structuredClone(state);
 if(selected.length){try{next=buildImport(state,selected,decisions,new Map(),now);}catch(e){fail('REQUIRES_REVIEW',e.message,409);}const keys=new Set(selected.map(x=>x.key));for(const s of next.sessions)if(s.picklePoint&&keys.has(sourceKey(s.picklePoint.sourceInstanceId,s.picklePoint.snapshot.id)))s.picklePoint.delivery='api-sync';}
 next.settings.picklePointSyncReceipts=[...receipts.values()];normalizeSyncReceipts(next.settings.picklePointSyncReceipts);
 return {state:next,results,changed:!!selected.length||receiptChanged};
}
