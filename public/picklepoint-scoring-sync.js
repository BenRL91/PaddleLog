import {parseSyncRequest,reconcileSync,syncDigest,PicklePointSyncError} from './picklepoint-sync.js';
import {sourceKey,canonicalJSON} from './picklepoint-data.js';
import {normalizeScoringSnapshot,normalizeScoringReceipts,derivePaddleAssociation} from './picklepoint-scoring-data.js';
const fail=(code,message,status=409,sessionId=null)=>{throw new PicklePointSyncError(code,message,status,sessionId);};
export function parseScoringSyncRequest(body){
 if(!body||Object.keys(body).length!==6||!['format','integrationVersion','operation','sessionExport','physicalPaddleReferences','scoringSnapshots'].every(k=>Object.hasOwn(body,k))||body.integrationVersion!==2)fail('UNSUPPORTED_SYNC_CONTRACT','Use the documented integrationVersion 2 upsert contract.',400);
 const {scoringSnapshots,...base}=body,request=parseSyncRequest({...base,integrationVersion:1});if(!Array.isArray(scoringSnapshots)||scoringSnapshots.length!==request.records.length)fail('INVALID_SCORING','One complete scoring snapshot is required per source session.',422);
 const snapshots=new Map();for(const value of scoringSnapshots){let snapshot;try{snapshot=normalizeScoringSnapshot(value);}catch(e){fail('INVALID_SCORING',e.message,422);}if(snapshots.has(snapshot.sessionId)||!request.refs.has(snapshot.sessionId))fail('INVALID_SCORING','Unknown or duplicate scoring session.',422,snapshot.sessionId);snapshots.set(snapshot.sessionId,snapshot);}
 for(const row of request.records){const snapshot=snapshots.get(row.source.id),owners=new Map(snapshot.owner.participation.map(p=>[p.gameId,p])),refs=request.refs.get(row.source.id);for(const g of snapshot.matches.flatMap(m=>m.games)){if(g.timeBasis==='elapsed-game'&&(Date.parse(g.start)<Date.parse(row.source.start)||Date.parse(g.end)>Date.parse(row.source.end)))fail('INVALID_SCORING','Game clocks must fit within the source session.',422,row.source.id);const derived=derivePaddleAssociation(g,owners.get(g.id),row.source.playIntervals,refs),claimed={...g.paddleAssociation,intervalIds:[...g.paddleAssociation.intervalIds].sort(),physicalPaddleIds:[...g.paddleAssociation.physicalPaddleIds].sort()};if(canonicalJSON(claimed)!==canonicalJSON(derived))fail('INVALID_PADDLE_ASSOCIATION','Game paddle association disagrees with recorded play and owner participation.',422,row.source.id);g.paddleAssociation=derived;}}
 return {...request,snapshots};
}
const normalizedSnapshot=snapshot=>({...snapshot,players:[...snapshot.players].sort((a,b)=>a.id.localeCompare(b.id)),owner:{...snapshot.owner,participation:[...snapshot.owner.participation].sort((a,b)=>a.gameId.localeCompare(b.gameId))}});
export async function reconcileScoringSync(state,request,now=new Date().toISOString()){
 const receipts=new Map(normalizeScoringReceipts(state.settings.picklePointScoringReceipts??[]).map(r=>[sourceKey(r.sourceInstanceId,r.sourceSessionId),r])),owned=new Set(state.paddles.map(p=>p.id));
 const accepted=[],plans=new Map(),results=[];
 for(const row of request.records){for(const id of request.refs.get(row.source.id).values())if(!owned.has(id))fail('PADDLE_REFERENCE_REQUIRES_RESOLUTION','A physical paddle reference is unavailable in your library.',422,row.source.id);
  const saved=state.sessions.find(s=>s.picklePoint&&sourceKey(s.picklePoint.sourceInstanceId,s.picklePoint.snapshot.id)===row.key),receipt=receipts.get(row.key),usageReceipt=(state.settings.picklePointSyncReceipts??[]).find(r=>sourceKey(r.sourceInstanceId,r.sourceSessionId)===row.key),latestUsage=Math.max(saved?.picklePoint?.snapshot.revision??0,usageReceipt?.revision??0);
  if(row.source.revision<latestUsage){const error=new PicklePointSyncError('STALE_USAGE_BASELINE','Rebuild scoring from the latest source usage revision.',409,row.source.id);error.latestUsageRevision=latestUsage;throw error;}
  const snapshot=request.snapshots.get(row.source.id),normalized=normalizedSnapshot(snapshot),digest=await syncDigest({snapshot:normalized,usage:row.source,references:[...request.refs.get(row.source.id)].sort(([a],[b])=>a.localeCompare(b))}),latest=Math.max(receipt?.revision??0,saved?.picklePointScoring?.snapshot.revision??0);
  if(snapshot.revision<latest){results.push({sourceSessionId:row.source.id,paddleLogSessionId:saved?.id??receipt.sessionId,status:'stale',revision:latest,usageRevision:latestUsage});continue;}
  if(receipt?.revision!==snapshot.revision&&saved?.picklePointScoring?.snapshot.revision===snapshot.revision){const baseline=await syncDigest({snapshot:normalizedSnapshot(saved.picklePointScoring.snapshot),usage:saved.picklePoint.snapshot,references:saved.picklePoint.applied.segments.map(i=>[i.id,i.paddleId]).sort(([a],[b])=>a.localeCompare(b))});if(baseline!==digest)fail('REVISION_CONFLICT','The same restored scoring revision has different content.',409,row.source.id);}
  if(receipt&&snapshot.revision===receipt.revision&&digest!==receipt.digest)fail('REVISION_CONFLICT','The same scoring revision has different scoring, usage or bindings. Send a higher scoring revision.',409,row.source.id);
  if(receipt&&!saved)fail('LOCAL_SESSION_REMOVED','This session was removed locally. Restore it through the reviewed file importer.',409,row.source.id);
  if(receipt&&saved&&receipt.revision>(saved.picklePointScoring?.snapshot.revision??0))fail('SYNC_STATE_REQUIRES_REVIEW','Restored scoring and durable receipt differ. Resolve before automatic delivery.',409,row.source.id);
  accepted.push(row);plans.set(row.key,{snapshot,digest,receipt,saved});
 }
 // One pure domain dry run; no database writes occur until both lanes have succeeded.
 const usage=await reconcileSync(state,{records:accepted,refs:request.refs},now),next=usage.state;let changed=usage.changed;
 for(const row of accepted){const plan=plans.get(row.key),result=usage.results.find(r=>r.sourceSessionId===row.source.id),session=next.sessions.find(s=>s.id===result.paddleLogSessionId);if(!session)fail('SYNC_STATE_REQUIRES_REVIEW','Source usage did not resolve a local session.',409,row.source.id);
  const same=plan.receipt?.revision===plan.snapshot.revision;if(!same){session.picklePointScoring={snapshot:plan.snapshot,usageRevision:row.source.revision};changed=true;}
  const receipt={sourceInstanceId:row.instance,sourceSessionId:row.source.id,sessionId:session.id,revision:plan.snapshot.revision,usageRevision:row.source.revision,digest:plan.digest};if(canonicalJSON(plan.receipt)!==canonicalJSON(receipt)){receipts.set(row.key,receipt);changed=true;}
  results.push({...result,status:same?result.status:plan.saved?'updated':'created',revision:plan.snapshot.revision,usageRevision:row.source.revision});
 }
 next.settings.picklePointScoringReceipts=[...receipts.values()];return {state:next,changed,results:request.records.map(r=>results.find(x=>x.sourceSessionId===r.source.id))};
}
