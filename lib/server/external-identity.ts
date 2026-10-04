import {cookieAuthorization} from './web-session';
import {createClient} from '@supabase/supabase-js';
/** Verify against the configured provider on every request. Never trust a decoded JWT,
 * client account ID, email match, or caller-supplied issuer. No admin key is needed. */
export interface AuthConfig {LEEWAY_AUTH_MODE?:string;SUPABASE_URL?:string;SUPABASE_PUBLISHABLE_KEY?:string}
export interface VerifiedIdentity {issuer:string;subject:string;verifiedEmail?:string}
export async function verifiedExternalIdentity(req:Request|undefined,config:AuthConfig):Promise<VerifiedIdentity>{
 if(!config.SUPABASE_URL||!config.SUPABASE_PUBLISHABLE_KEY)throw new Error('Shared sign-in is not configured.');
 const url=new URL(config.SUPABASE_URL);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw new Error('Invalid identity provider configuration.');
 const authorization=req?.headers.get('authorization')??cookieAuthorization(req);
 if(!/^Bearer [^\s]{20,16384}$/i.test(authorization))throw new Error('Sign in required.');
 const token=authorization.slice(7);
 const auth=createClient(url.origin,config.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})}});
 const {data,error}=await auth.auth.getUser(token);
 if(error||!data.user||data.user.is_anonymous||!data.user.id)throw new Error('Sign-in could not be verified.');
 return {issuer:url.origin+'/auth/v1',subject:data.user.id,verifiedEmail:data.user.email_confirmed_at?data.user.email?.trim().toLowerCase():undefined};
}
