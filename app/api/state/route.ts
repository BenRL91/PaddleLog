import {OWNER_ACCOUNT_ID} from '@/lib/server/test-access';
import {recordHealth} from '@/lib/server/health';
import {applyChanges} from '@/public/record-sync.js';
import {readLibrary,saveLibrary} from '@/lib/server/library';
import {grantsFor} from '@/lib/server/entitlements';
import {authorizePaddleChange} from '@/public/feature-policy.js';
import {storage} from '@/db/store';
import {validate} from '@/public/validate.js';
import {account,failure,crossSite} from '@/lib/server/account';
const blank=()=>({version:2,paddles:[],sessions:[],usagePeriods:[],catalog:[]});
export async function GET(req?:Request){let healthAccount:string|null=null;try{const a=await account(false,req);healthAccount=a.id;const row=await readLibrary(a.id);return Response.json({accountId:a.id,legacyOwner:!!a.legacy_owner,canManageTesters:a.id===OWNER_ACCOUNT_ID,state:row?JSON.parse(row.payload):blank(),revision:row?.revision??0},{headers:{'Cache-Control':'no-store'}});}catch(e){if(healthAccount)await recordHealth(healthAccount,'load_failed');return failure(e);}}
export async function PUT(req:Request){
 if(crossSite(req))return Response.json({error:'Cross-site request rejected'},{status:403});
 let healthAccount:string|null=null;
 try{const a=await account(false,req);healthAccount=a.id;const raw=await req.text();if(raw.length>2000000)return Response.json({error:'Backup exceeds 2 MB.'},{status:413});
 let d,state;try{d=JSON.parse(raw);if(d.changes===undefined)state=validate(d.state);if(!Number.isSafeInteger(d.revision)||d.revision<0)throw new Error('Invalid revision');}catch{return Response.json({error:'Invalid records or revision. Review your entries.'},{status:400});}
 if(d.accountId!==a.id)return Response.json({error:'Account changed. Reload before saving; your draft is kept.'},{status:409});
 const db=storage();
 const current=await readLibrary(a.id);
 if((current?.revision??0)!==d.revision){await recordHealth(a.id,'sync_conflict');return Response.json({error:'Records changed. Retry saving.'},{status:409});}
 if(d.changes!==undefined){try{d.state=applyChanges(current?JSON.parse(current.payload):blank(),d.changes);state=validate(d.state);}catch{return Response.json({error:'Invalid record changes. Your saved library is unchanged.'},{status:400});}}
 // Preserve new fields when an already-open older client submits a legacy snapshot.
 if(current){const previous=JSON.parse(current.payload);if(previous.sessions?.some((s:{estimatedHours?:number})=>s.estimatedHours!=null)&&d.state.usageSchema!==1)return Response.json({error:'PaddleLog was updated. Reload this tab before saving to preserve estimated usage.'},{status:400});if(d.state.settings===undefined){d.state.settings=previous.settings;if(d.state.settings?.mainPaddleId&&!d.state.paddles.some((p:{id:string})=>p.id===d.state.settings.mainPaddleId))d.state.settings={...d.state.settings,mainPaddleId:null};}if(d.state.settings&&d.state.settings.edgeTapeHoursPerLevel===undefined&&previous.settings?.edgeTapeHoursPerLevel!==undefined)d.state.settings.edgeTapeHoursPerLevel=previous.settings.edgeTapeHoursPerLevel;for(const key of ['playerProfile','paddleOrder','locations','singlesMainPaddleId','doublesMainPaddleId','mixedMainPaddleId','favoriteOrder'])if(d.state.settings&&d.state.settings[key]===undefined&&previous.settings?.[key]!==undefined)d.state.settings[key]=previous.settings[key];for(const key of ['singlesMainPaddleId','doublesMainPaddleId','mixedMainPaddleId'])if(d.state.settings?.[key]&&!d.state.paddles.some((p:{id:string})=>p.id===d.state.settings[key]))d.state.settings[key]=null;for(const p of d.state.paddles){const old=previous.paddles.find((x:{id:string})=>x.id===p.id);for(const key of ['balancePoint','collectible','collectibleLabel','tuningImageId','overgripInstalledAt','maintenance','configuration','feelPosition','archivedAt','disposition','archiveHistory','purchasedOn','purchase'])if(p[key]===undefined&&old?.[key]!==undefined)p[key]=old[key];}for(const p of d.state.paddles){const old=previous.paddles.find((x:{id:string})=>x.id===p.id);for(const key of ['weights','approvalReferences'])if(p.configuration&&p.configuration[key]===undefined&&old?.configuration?.[key]!==undefined)p.configuration[key]=old.configuration[key];}for(const session of d.state.sessions){const old=previous.sessions.find((s:{id:string})=>s.id===session.id);for(const key of ['ball','location','environment','weather','netType','photoId','beforePhotoId','afterPhotoId'])if(session[key]===undefined&&old?.[key]!==undefined)session[key]=old[key];}state=validate(d.state);}
 if(!state)return Response.json({error:'No valid library supplied.'},{status:400});
 const access=authorizePaddleChange(current?JSON.parse(current.payload):blank(),state,await grantsFor(a.id));
 if(!access.allowed)return Response.json({error:access.message,...access},{status:403});
 const previous=current?JSON.parse(current.payload):blank(),ownedBefore=new Set<string>();
 const oldPaddlePhotos=new Set<string>(previous.paddles.flatMap((p:any)=>[p.photoId,p.tuningImageId].filter(Boolean)));
 const oldSessionPhotos=new Set<string>(previous.sessions.flatMap((s:any)=>[s.photoId,s.beforePhotoId,s.afterPhotoId].filter(Boolean)));
 const paddlePhotos=new Set<string>(state.paddles.flatMap((p:any)=>[p.photoId,p.tuningImageId].filter(Boolean)));
 const sessionPhotos=new Set<string>(state.sessions.flatMap((s:any)=>[s.photoId,s.beforePhotoId,s.afterPhotoId].filter(Boolean)));
 const needed=[...new Set([...paddlePhotos,...sessionPhotos])].filter(id=>!oldPaddlePhotos.has(id)||sessionPhotos.has(id)&&!oldSessionPhotos.has(id));
 for(let i=0;i<needed.length;i+=80){const ids=needed.slice(i,i+80),result=await db.prepare(`SELECT id FROM account_photos WHERE account_id=? AND id IN (${ids.map(()=>'?').join(',')})`).bind(a.id,...ids).all();for(const row of result.results as any[])ownedBefore.add(row.id);}
 for(const id of paddlePhotos)if(!oldPaddlePhotos.has(id)&&!ownedBefore.has(id))return Response.json({error:'Photo does not belong to this account.'},{status:400});
 for(const id of sessionPhotos)if(!oldSessionPhotos.has(id)&&!ownedBefore.has(id))return Response.json({error:'Session photo does not belong to this account.'},{status:400});
 const changed=await saveLibrary(a.id,state,d.revision,current);
 if(!changed){await recordHealth(a.id,'sync_conflict');return Response.json({error:'Records changed. Retry saving.'},{status:409});}await recordHealth(a.id,'save_success');return Response.json({revision:d.revision+1});
 }catch(e){if(healthAccount)await recordHealth(healthAccount,'save_failed');return failure(e);}
}

export async function PATCH(req:Request){return PUT(req);}
