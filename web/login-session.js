// An existing cookie session should enter the app, not offer another signup.
export async function resumeExistingSession({mode,hasCallback,fetcher=fetch}){
 if(mode!=='supabase'||hasCallback)return false;
 const response=await fetcher('/api/auth/session',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-leeway-session':'1'},body:JSON.stringify({action:'refresh'})});
 if(response.status===401||response.status===403||response.status===503)return false;
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||'Could not check your sign-in. Please reload and try again.');
 return data.mode==='supabase'&&typeof data.accountId==='string'&&!!data.accountId;
}
