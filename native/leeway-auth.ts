import {createClient} from '@supabase/supabase-js';
import type {AuthAdapter,SecureTokenStore} from '../shared/contracts';
/** Shared LeewayPB identity client. Provide OS secure storage and a system browser;
 * deliberately no localStorage/Preferences fallback for tokens or PKCE verifiers. */
export function createLeewayAuth(options:{url:string;publishableKey:string;apiOrigin:string;redirectUrl:string;secureStore:SecureTokenStore;openBrowser:(url:string)=>Promise<void>;fetcher?:typeof fetch}){
 const {secureStore}=options,fetcher=options.fetcher??fetch;
 const provider=new URL(options.url),api=new URL(options.apiOrigin),callback=new URL(options.redirectUrl);
 if(provider.protocol!=='https:'||api.protocol!=='https:'||provider.username||api.username||provider.pathname!=='/'||api.pathname!=='/')throw new Error('Verified HTTPS origins required.');
 if(!['https:','paddlelog:'].includes(callback.protocol)||callback.search||callback.hash)throw new Error('Register an exact auth callback first.');
 const client=createClient(provider.origin,options.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:false,persistSession:true,autoRefreshToken:true,storageKey:'leewaypb-auth',storage:{getItem:k=>secureStore.get(k),setItem:(k,v)=>secureStore.set(k,v),removeItem:k=>secureStore.remove(k)}}});
 const message='Already use another LeewayPB app? Use the same sign-in method and account. If you used Apple Hide My Email, choose Apple again.';
 async function accessToken(){const {data,error}=await client.auth.getSession();if(error)throw error;return data.session?.access_token??null;}
 const adapter:AuthAdapter={
  async currentAccount(){const token=await accessToken();if(!token)return null;const response=await fetcher(api.origin+'/api/auth/account',{headers:{Authorization:'Bearer '+token},credentials:'omit'});if(response.status===401)return null;if(!response.ok)throw new Error('Account verification unavailable.');const a=await response.json() as {id?:unknown};if(typeof a.id!=='string')throw new Error('Invalid account response');return {id:a.id};},
  async signIn(){throw new Error('Choose Apple, Google or email to sign in.');},
  async signOut(){const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;},accessToken
 };
 return {...adapter,message,
  async oauth(provider:'apple'|'google'){const {data,error}=await client.auth.signInWithOAuth({provider,options:{redirectTo:callback.href,skipBrowserRedirect:true,...(provider==='google'?{queryParams:{prompt:'select_account'}}:{})}});if(error)throw error;if(!data.url)throw new Error('Sign-in URL unavailable');const target=new URL(data.url);if(target.origin!==new URL(options.url).origin)throw new Error('Unexpected sign-in destination');await options.openBrowser(data.url);},
  async email(email:string){const {error}=await client.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:callback.href}});if(error)throw error;},
  async emailCode(email:string,token:string){const {error}=await client.auth.verifyOtp({email:email.trim(),token:token.trim(),type:'email'});if(error)throw error;},
  async callback(url:string){const incoming=new URL(url);if(incoming.protocol!==callback.protocol||incoming.host!==callback.host||incoming.pathname!==callback.pathname||incoming.hash)throw new Error('Unrecognized sign-in callback.');const code=incoming.searchParams.get('code');if(!code||incoming.searchParams.has('error'))throw new Error('Sign-in was cancelled or expired.');const {error}=await client.auth.exchangeCodeForSession(code);if(error)throw error;},
  async linkExistingOwner(privateSiteOrigin:string,expectedAccountId:string){const origin=new URL(privateSiteOrigin);if(origin.protocol!=='https:'||origin.pathname!=='/')throw new Error('Invalid private site origin');const token=await accessToken();if(!token)throw new Error('Sign in to LeewayPB first');const response=await fetcher(origin.origin+'/api/auth/link',{method:'POST',credentials:'include',headers:{Authorization:'Bearer '+token,'x-confirm-link':'link-my-leeway-account','x-link-account':expectedAccountId}});if(!response.ok)throw new Error('Account linking could not complete. Existing records are safe.');return response.json();},
  setActive(active:boolean){if(active)client.auth.startAutoRefresh();else client.auth.stopAutoRefresh();}
 };
}
