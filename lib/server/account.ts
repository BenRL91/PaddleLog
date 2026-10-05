import {claimTestAccess} from './test-access';
import {ensurePaddleLogMembership,paddleLogMembership} from './app-membership';
import {nativeOriginAllowed} from './native-cors.mjs';
import {env} from 'cloudflare:workers';
import {verifiedExternalIdentity} from './external-identity';
import {externalAccount} from './identity-map';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {storage} from '@/db/store';
const legacyOwnerHash = "0000000000000000000000000000000000000000000000000000000000000000";
export class AccountError extends Error { constructor(public status:number,message:string){super(message);} }
export async function account(allowDeleting=false,req?:Request){
 if(env.LEEWAY_AUTH_MODE==='supabase'){
  let identity;try{identity=await verifiedExternalIdentity(req,env);}catch{throw new AccountError(401,'Sign in to your LeewayPB account. Your draft is kept.');}
  if(req&&!req.headers.has('authorization')&&!['GET','HEAD'].includes(req.method)&&req.headers.get('origin')!==new URL(req.url).origin)throw new AccountError(403,'Same-origin request required.');
  const a=await externalAccount(identity);if(a&&req?.headers.has('x-leeway-account')&&req.headers.get('x-leeway-account')!==a.id)throw new AccountError(409,'Account changed. Reload to continue; your draft is kept.');if(!a)throw new AccountError(503,'Account unavailable.');if(a.status!=='active'&&!allowDeleting)throw new AccountError(409,'Suite account maintenance is in progress.');const membership=a.status==='active'?await ensurePaddleLogMembership(a.id):await paddleLogMembership(a.id);if(!membership&&!allowDeleting)throw new AccountError(403,'PaddleLog membership is required.');if(membership?.status!=='active'&&!allowDeleting)throw new AccountError(403,'PaddleLog access is inactive.');if(a.status==='active'&&membership?.status==='active')await claimTestAccess(a.id,identity.verifiedEmail);return a;
 }
 if(env.LEEWAY_AUTH_MODE&&env.LEEWAY_AUTH_MODE!=='sites')throw new AccountError(503,'Sign-in configuration is unavailable.');
 const user=await getChatGPTUser();if(!user)throw new AccountError(401,'Sign in to continue. Your local draft is kept.');
 const db=storage();
 await db.prepare("INSERT OR IGNORE INTO leeway_accounts(id,subject,status) VALUES (?,?,'active')").bind(crypto.randomUUID(),user.userId).run();
 const a=await db.prepare('SELECT id,status,legacy_owner FROM leeway_accounts WHERE subject=?').bind(user.userId).first<{id:string,status:string,legacy_owner:number}>();
 if(!a)throw new Error('Account unavailable');
 if(a.status!=='active'&&!allowDeleting)throw new AccountError(409,'Suite account maintenance is in progress.');
 const membership=a.status==='active'?await ensurePaddleLogMembership(a.id):await paddleLogMembership(a.id);if(!membership&&!allowDeleting)throw new AccountError(403,'PaddleLog membership is required.');if(membership?.status!=='active'&&!allowDeleting)throw new AccountError(403,'PaddleLog access is inactive.');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user.email.trim().toLowerCase()));
 const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 if(hash===legacyOwnerHash){
  // Trusted Sites identity only; never let the first visitor claim the legacy library.
  await db.batch([
   db.prepare('UPDATE leeway_accounts SET legacy_owner=1 WHERE id=?').bind(a.id),
   db.prepare('INSERT OR IGNORE INTO account_logs(account_id,payload,revision) SELECT ?,payload,revision FROM paddle_logs WHERE id=1').bind(a.id)
  ]);a.legacy_owner=1;
 }
 return a;
}
export function failure(e:unknown){if(e instanceof AccountError)return Response.json({error:e.message},{status:e.status});console.error('Account operation failed');return Response.json({error:'Service unavailable. Your draft is kept; please retry.'},{status:503});}
export function crossSite(req:Request){return req.headers.get('sec-fetch-site')==='cross-site'&&!(nativeOriginAllowed(req,env)&&/^Bearer \S+$/.test(req.headers.get('authorization')??''));}
