import {backupPolicy} from '@/public/backup-policy.js';
import {env} from 'cloudflare:workers';
import {account,failure} from '@/lib/server/account';
export async function GET(req:Request){try{const a=await account(false,req);if(!env.BUCKET)throw Error('Recovery storage unavailable');const prefix=`accounts/${a.id}/backups/`,id=new URL(req.url).searchParams.get('id');
 if(id){if(!/^\d{12}\.json$/.test(id))return Response.json({error:'Invalid recovery reference.'},{status:400});const object=await env.BUCKET.get(prefix+id);if(!object)return Response.json({error:'Recovery copy unavailable.'},{status:404});const data=await object.json();return Response.json(data,{headers:{'Cache-Control':'private, no-store'}});}
 const copies:any[]=[];let cursor:string|undefined;do{const page=await env.BUCKET.list({prefix,cursor});for(const o of page.objects)copies.push({id:o.key.slice(prefix.length),uploaded:o.uploaded??null,revision:Number(o.key.slice(prefix.length).replace('.json',''))});cursor=page.truncated?page.cursor:undefined;}while(cursor);
 return Response.json({accountId:a.id,policy:backupPolicy,copies:copies.sort((a,b)=>b.revision-a.revision)},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return failure(e);}}
