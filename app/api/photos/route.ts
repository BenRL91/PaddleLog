import {account,failure} from '@/lib/server/account';
import {storage} from '@/db/store';
import {env} from 'cloudflare:workers';
import {MAX_PHOTO_BYTES,photoType,photoIdValid} from '@/public/photos.js';
// All photo routes use the same private owner-only Sites access boundary as the log.
export async function POST(req:Request){
 if(req.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Cross-site request rejected.'},{status:403});
 try{const a=await account(false,req);if(!env.BUCKET)return Response.json({error:'Photo storage is temporarily unavailable. Your draft is kept.'},{status:503});
 const reader=req.body?.getReader();if(!reader)return Response.json({error:'Choose an image.'},{status:400});const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_PHOTO_BYTES){await reader.cancel();return Response.json({error:'Photo exceeds 6 MB.'},{status:413});}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}const type=photoType(bytes);if(!type)return Response.json({error:'Use a JPEG, PNG or WebP image.'},{status:415});const id=crypto.randomUUID();const key='accounts/'+a.id+'/photos/'+id;await storage().prepare('INSERT INTO account_photos(id,account_id,object_key) VALUES (?,?,?)').bind(id,a.id,key).run();await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:type}});const live=await storage().prepare("SELECT id FROM leeway_accounts WHERE id=? AND status='active'").bind(a.id).first();if(!live){await env.BUCKET.delete(key);return new Response('Account unavailable',{status:409});}return Response.json({id},{status:201});
 }catch(e){return failure(e);}
}
export async function GET(req:Request){
 const id=new URL(req.url).searchParams.get('id');if(!photoIdValid(id))return new Response('Not found',{status:404});
 try{const a=await account(false,req);if(!env.BUCKET)return new Response('Photo storage unavailable',{status:503});const photo=await storage().prepare('SELECT object_key FROM account_photos WHERE id=? AND account_id=?').bind(id,a.id).first<{object_key:string}>();if(!photo&&!a.legacy_owner)return new Response('Photo not found',{status:404});const obj=await env.BUCKET.get(photo?.object_key??('paddle-photos/'+id));if(!obj)return new Response('Photo not found',{status:404});return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType??'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch(e){return failure(e);}
}
