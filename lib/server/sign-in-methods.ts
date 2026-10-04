import {createClient} from '@supabase/supabase-js';
import {cookie,accessCookie,refreshCookie} from './web-session';
import type {AuthConfig} from './external-identity';
export const linkCookie='__Host-leeway-link';
export function pendingLink(req:Request){try{const p=JSON.parse(decodeURIComponent(cookie(req,linkCookie)));return p&&typeof p.subject==='string'&&p.expires>Date.now()&&p.expires<Date.now()+16*60000?p:null;}catch{return null;}}
export function linkHeader(value?:object){return `${linkCookie}=${value?encodeURIComponent(JSON.stringify(value)):''}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${value?900:0}`;}
export function methodClient(req:Request,config:AuthConfig,proof:Record<string,string>={}){
 const memory=new Map<string,string>(Object.entries(proof));
 const client=createClient(config.SUPABASE_URL!,config.SUPABASE_PUBLISHABLE_KEY!,{auth:{flowType:'pkce',storageKey:'leeway-methods',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>{memory.set(k,v);},removeItem:k=>{memory.delete(k);}}},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})}});
 return {client,memory,async user(){const {data,error}=await client.auth.getUser(cookie(req,accessCookie));if(error||!data.user||data.user.is_anonymous)throw Error('Sign in again before managing your sign-in methods.');return data.user;},async seed(){const {data,error}=await client.auth.setSession({access_token:cookie(req,accessCookie),refresh_token:cookie(req,refreshCookie)});if(error||!data.session)throw Error('Your session expired. Reopen Account and try again.');return data.session;}};
}
export async function beginMethodLink(req:Request,config:AuthConfig,provider:'google'|'apple',redirectTo:string){
 const sdk=methodClient(req,config),user=await sdk.user();
 if(user.identities?.some(i=>i.provider===provider))throw Error('This sign-in method is already connected.');
 await sdk.seed();
 const {data,error}=await sdk.client.auth.linkIdentity({provider,options:{redirectTo,skipBrowserRedirect:true,...(provider==='google'?{queryParams:{prompt:'select_account'}}:{})}});
 if(error||!data.url)throw Error('Could not start account linking. Check that this provider and manual linking are enabled.');
 const url=new URL(data.url);if(url.protocol!=='https:'||![new URL(config.SUPABASE_URL!).host,'accounts.google.com','appleid.apple.com'].includes(url.host))throw Error('Unexpected sign-in destination.');
 const proof=Object.fromEntries([...sdk.memory].filter(([k])=>k.includes('code-verifier')));
 if(!Object.keys(proof).length)throw Error('Could not preserve the verification request.');
 return {url:url.href,pending:{subject:user.id,provider,proof,flowId:data.flowId,expires:Date.now()+900000}};
}
export async function completeMethodLink(req:Request,config:AuthConfig,code:string){
 const pending=pendingLink(req);if(!pending)throw Error('This linking request expired. Open Account and try again.');
 const sdk=methodClient(req,config,pending.proof),before=await sdk.user();
 if(before.id!==pending.subject)throw Error('Your signed-in account changed. No libraries were merged.');
 const {data,error}=await sdk.client.auth.exchangeCodeForSession(code,{flowId:pending.flowId??undefined});
 if(error||!data.session)throw Error('Could not verify this linking request. Open Account and try again.');
 const {data:verified,error:verifyError}=await sdk.client.auth.getUser(data.session.access_token);
 if(verifyError||verified.user?.id!==before.id||!verified.user.identities?.some(i=>i.provider===pending.provider))throw Error('The sign-in method was not linked to this account. No libraries were merged.');
 return data.session;
}
