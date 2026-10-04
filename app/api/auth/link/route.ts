import {env} from 'cloudflare:workers';
import {account,failure,crossSite,AccountError} from '@/lib/server/account';
import {verifiedExternalIdentity} from '@/lib/server/external-identity';
import {linkExternalIdentity} from '@/lib/server/identity-map';
/** Owner migration: prove BOTH existing Sites session and new LeewayPB login.
 * The new JWT goes in Authorization; the caller never selects an account ID. */
export async function POST(req:Request){
 if(crossSite(req)||req.headers.get('x-confirm-link')!=='link-my-leeway-account')return Response.json({error:'Explicit account-link confirmation required.'},{status:400});
 try{
  if(env.LEEWAY_AUTH_MODE&&env.LEEWAY_AUTH_MODE!=='sites')throw new AccountError(503,'Owner migration is available only on the private Sites deployment.');
  const a=await account();if(req.headers.get('x-link-account')!==a.id)throw new AccountError(409,'Your PaddleLog account changed. Reload before linking.');const identity=await verifiedExternalIdentity(req,env);
  try{return Response.json(await linkExternalIdentity(a.id,identity),{headers:{'Cache-Control':'no-store'}});}catch{throw new AccountError(409,'That sign-in is already linked elsewhere. Your existing records are unchanged.');}
 }catch(e){return failure(e);}
}
