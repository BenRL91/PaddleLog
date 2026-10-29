import {parseScoringSyncRequest,reconcileScoringSync} from '@/public/picklepoint-scoring-sync.js';
import {picklePointAccount,readSyncBody} from '@/lib/server/picklepoint-integration';
import {readLibrary,saveLibrary} from '@/lib/server/library';
import {failure} from '@/lib/server/account';
import {recordHealth} from '@/lib/server/health';
import {validate} from '@/public/validate.js';
import {parseSyncRequest,reconcileSync,PicklePointSyncError} from '@/public/picklepoint-sync.js';
export async function POST(req:Request){let owner:string|null=null;try{
 const a=await picklePointAccount(req);owner=a.id;const body=await readSyncBody(req),v2=body?.integrationVersion===2,request=v2?parseScoringSyncRequest(body):parseSyncRequest(body),current=await readLibrary(a.id);
 const state=validate(JSON.parse(current?.payload??'{"version":2,"paddles":[],"sessions":[],"usagePeriods":[],"catalog":[]}'));
 const sync=await (v2?reconcileScoringSync:reconcileSync)(state,request),revision=current?.revision??0;
 if(sync.changed){const next=validate(sync.state);if(new TextEncoder().encode(JSON.stringify(next)).length>=1900000)throw new PicklePointSyncError('LIBRARY_LIMIT','This delivery would exceed the current library import/backup limit. Resolve storage before retrying.',413);if(!await saveLibrary(a.id,next,revision,current)){await recordHealth(a.id,'sync_conflict');return Response.json({error:'Library changed during delivery. Retry the same request.',code:'LIBRARY_CHANGED',retryable:true},{status:409,headers:{'Cache-Control':'no-store'}});}await recordHealth(a.id,'save_success');}
 return Response.json({format:'leewaypb.paddlelog-session-sync-result',integrationVersion:v2?2:1,libraryVersion:revision+(sync.changed?1:0),results:sync.results},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){if(e instanceof PicklePointSyncError)return Response.json({error:e.message,code:e.code,sourceSessionId:e.sessionId,retryable:false,...('latestUsageRevision' in e?{latestUsageRevision:e.latestUsageRevision}:{})},{status:e.status,headers:{'Cache-Control':'no-store'}});if(owner)await recordHealth(owner,'save_failed');return failure(e);}}
