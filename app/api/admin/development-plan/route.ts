import {account,AccountError,failure} from '@/lib/server/account';
import {OWNER_ACCOUNT_ID} from '@/lib/server/test-access';
import {sameOriginMutation} from '@/lib/server/web-session';
import {storage} from '@/db/store';
export async function POST(req:Request){try{
 const a=await account(false,req);if(a.id!==OWNER_ACCOUNT_ID)throw new AccountError(403,'Owner access required.');
 if(!sameOriginMutation(req))throw new AccountError(403,'Same-origin confirmation required.');
 const raw=await req.text();if(raw.length>256)throw new AccountError(413,'Request too large.');
 let mode;try{mode=JSON.parse(raw).mode;}catch{throw new AccountError(400,'Choose a test plan.');}
 if(!['actual','free','pro'].includes(mode))throw new AccountError(400,'Choose a test plan.');
 const now=Date.now();await storage().prepare("INSERT INTO entitlement_grants(id,account_id,key,source,source_ref,starts_at,ends_at,revoked_at,verified_at,metadata) VALUES(?,?,?,?,?,?,NULL,?,?,?) ON CONFLICT(source_ref) DO UPDATE SET key=excluded.key,revoked_at=excluded.revoked_at,verified_at=excluded.verified_at,metadata=excluded.metadata").bind(crypto.randomUUID(),a.id,mode==='free'?'paddlelog_dev_free':'paddlelog_pro','owner_development','owner-development:'+a.id,now,mode==='actual'?now:null,now,JSON.stringify({billing:'none',purpose:'Owner development plan',mode})).run();
 return Response.json({saved:true,mode},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
