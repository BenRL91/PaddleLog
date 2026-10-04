import {createClient} from '@supabase/supabase-js';
import type {AuthConfig} from './external-identity';
export const accessCookie='__Host-leeway-access',refreshCookie='__Host-leeway-refresh';
export function cookie(req:Request|undefined,name:string){return (req?.headers.get('cookie')??'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)??'';}
export function cookieAuthorization(req:Request|undefined){const token=cookie(req,accessCookie);return token?'Bearer '+token:'';}
export function sameOriginMutation(req:Request){return req.headers.get('origin')===new URL(req.url).origin&&req.headers.get('x-leeway-session')==='1';}
export function sessionHeaders(session?:{access_token:string;refresh_token:string;expires_in:number}){const h=new Headers({'Cache-Control':'no-store'});for(const [name,value,age] of [[accessCookie,session?.access_token??'',session?.expires_in??0],[refreshCookie,session?.refresh_token??'',session?2592000:0]])h.append('Set-Cookie',`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`);return h;}
export async function refreshWebSession(token:string,config:AuthConfig){
 if(!token||token.length>16384||/\s|;/.test(token))throw new Error('Sign in again.');
 if(!config.SUPABASE_URL||!config.SUPABASE_PUBLISHABLE_KEY)throw new Error('Sign-in is unavailable.');
 const client=createClient(config.SUPABASE_URL,config.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})}});
 const {data,error}=await client.auth.refreshSession({refresh_token:token});
 if(error||!data.session||!data.user||data.user.is_anonymous)throw new Error('Sign in again.');
 return {session:data.session,identity:{issuer:new URL(config.SUPABASE_URL).origin+'/auth/v1',subject:data.user.id}};
}
