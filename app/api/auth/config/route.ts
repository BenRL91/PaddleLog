import {pendingLink} from '@/lib/server/sign-in-methods';
import {env} from 'cloudflare:workers';
import {account,failure,AccountError} from '@/lib/server/account';
import {storage} from '@/db/store';
export async function GET(req:Request){try{
 const standalone=env.LEEWAY_AUTH_MODE==='supabase';
 const a=standalone?null:await account();
 if(!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY||!env.LEEWAY_WEB_ORIGIN)throw new AccountError(503,'Shared sign-in is not configured yet.');
 const origin=new URL(env.LEEWAY_WEB_ORIGIN),provider=new URL(env.SUPABASE_URL);
 if((origin.protocol!=='https:'&&!(origin.protocol==='http:'&&origin.hostname==='localhost'))||origin.pathname!=='/'||origin.search||origin.hash||origin.username||provider.protocol!=='https:')throw new AccountError(503,'Sign-in URLs need configuration.');
 const response=await fetch(provider.origin+'/auth/v1/settings',{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new AccountError(503,'LeewayPB sign-in is temporarily unavailable. Your library is safe.');
 const settings=await response.json() as {external?:Record<string,boolean>};
 const linked=a?await storage().prepare('SELECT COUNT(*) AS count FROM leeway_identities WHERE account_id=? AND issuer=?').bind(a.id,provider.origin+'/auth/v1').first<{count:number}>():null;
 return Response.json({pendingLink:!!pendingLink(req),mode:standalone?'supabase':'sites',accountId:a?.id??'signin',url:provider.origin,publishableKey:env.SUPABASE_PUBLISHABLE_KEY,redirectTo:origin.origin+'/auth/return',providers:{email:settings.external?.email===true,google:settings.external?.google===true,apple:settings.external?.apple===true},linked:!!linked?.count},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
