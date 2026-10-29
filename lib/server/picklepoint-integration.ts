import {env} from 'cloudflare:workers';
import {account,AccountError} from '@/lib/server/account';
import {picklePointCors} from './picklepoint-cors.mjs';
import {MAX_PICKLEPOINT_BYTES} from '@/public/picklepoint-data.js';
import {syncDigest} from '@/public/picklepoint-sync.js';
export async function picklePointAccount(req:Request){
 const cors=picklePointCors(req,env);if(cors?.response)throw new AccountError(403,'Integration origin is not enabled.');
 if(env.LEEWAY_AUTH_MODE!=='supabase')throw new AccountError(503,'LeewayPB integration sign-in is unavailable.');
 if(!/^Bearer [^\s]{20,16384}$/i.test(req.headers.get('authorization')??''))throw new AccountError(401,'A verified LeewayPB user bearer token is required.');
 return account(false,req);
}
export async function readSyncBody(req:Request){
 if(req.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new AccountError(415,'Use application/json.');
 const declared=req.headers.get('content-length');if(declared&&(!/^\d+$/.test(declared)||Number(declared)>=MAX_PICKLEPOINT_BYTES))throw new AccountError(413,'Sync request must be smaller than 2,000,000 bytes.');
 const reader=req.body?.getReader();if(!reader)throw new AccountError(400,'Provide a sync payload.');let size=0;const chunks:Uint8Array[]=[];while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>=MAX_PICKLEPOINT_BYTES){await reader.cancel();throw new AccountError(413,'Sync request must be smaller than 2,000,000 bytes.');}chunks.push(r.value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new AccountError(400,'Provide valid UTF-8 JSON.');}
}
export async function paddleLibraryProjection(state:any,revision:number){
 const paddles=await Promise.all(state.paddles.map(async(p:any)=>{
  const item={physicalPaddleId:p.id,nickname:p.nickname??'',brand:p.brand,model:p.model,status:p.status??'active',isMain:state.settings?.mainPaddleId===p.id,isFavorite:!!p.favorite,image:p.photoId?{href:'/api/integrations/pickle-point/paddles/image?physicalPaddleId='+encodeURIComponent(p.id),requiresAuthorization:true}:null};
  return {...item,version:await syncDigest({...item,photoVersion:p.photoId??''})};
 }));return {format:'leewaypb.paddle-library',schemaVersion:1,libraryVersion:revision,paddles};
}
