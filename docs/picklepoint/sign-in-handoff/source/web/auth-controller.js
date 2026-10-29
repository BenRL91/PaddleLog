// Testable account-connection flow. SDK and browser integrations are supplied by entry.
export function createConnection({client,config,fetcher=fetch}){
 let session=null,busy=false;
 const exclusive=async task=>{if(busy)throw new Error('Please wait for the current sign-in step.');busy=true;try{return await task();}finally{busy=false;}};
 const verified=async candidate=>{if(!candidate?.access_token)throw new Error('Sign-in did not complete. Request a new email.');const {data,error}=await client.auth.getUser(candidate.access_token);if(error||!data.user||data.user.is_anonymous)throw new Error('Your sign-in could not be verified.');session=candidate;return data.user;};
 return {
  sendEmail:email=>exclusive(async()=>{const {error}=await client.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:config.redirectTo,shouldCreateUser:true}});if(error)throw error;}),
  verifyCode:(email,token)=>exclusive(async()=>{const {data,error}=await client.auth.verifyOtp({email:email.trim(),token:token.trim(),type:'email'});if(error)throw error;return verified(data.session);}),
  callback:code=>exclusive(async()=>{const {data,error}=await client.auth.exchangeCodeForSession(code);if(error)throw error;return verified(data.session);}),
  signIn:()=>exclusive(async()=>{if(!session?.refresh_token)throw new Error('Verify your sign-in first.');const r=await fetcher('/api/auth/session',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-leeway-session':'1'},body:JSON.stringify({action:'signin',refreshToken:session.refresh_token})});const result=await r.json();if(!r.ok)throw new Error(result.error||'Sign-in failed.');session=null;return result;}),
  oauth:provider=>exclusive(async()=>{if(!['apple','google'].includes(provider)||!config.providers[provider])throw new Error('This sign-in method is not configured yet.');const {data,error}=await client.auth.signInWithOAuth({provider,options:{redirectTo:config.redirectTo,skipBrowserRedirect:true,...(provider==='google'?{queryParams:{prompt:'select_account'}}:{})}});if(error)throw error;if(!data.url||new URL(data.url).origin!==new URL(config.url).origin)throw new Error('Invalid sign-in destination.');return data.url;}),
  link:()=>exclusive(async()=>{if(!session)throw new Error('Verify your LeewayPB sign-in first.');const r=await fetcher('/api/auth/link',{method:'POST',credentials:'same-origin',headers:{Authorization:'Bearer '+session.access_token,'x-confirm-link':'link-my-leeway-account','x-link-account':config.accountId}});const result=await r.json();if(!r.ok)throw new Error(result.error||'Account linking failed. Your library is unchanged.');if(result.accountId!==config.accountId)throw new Error('Account changed. Reload before continuing.');session=null;try{await client.auth.signOut({scope:'local'});}catch{}return result;}),
  cancel:()=>exclusive(async()=>{session=null;const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;})
 };
}
