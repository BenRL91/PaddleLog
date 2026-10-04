// Web-only session transport. Native builds retain their secure-store adapter.
const originalFetch=window.fetch.bind(window);
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('leewaypb-session'):null;
channel?.addEventListener('message',()=>location.reload());
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
let mode='sites',accountId=null,refreshing=null;
async function session(action,extra={}){
 const r=await originalFetch('/api/auth/session',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-leeway-session':'1'},body:JSON.stringify({action,...extra})});
 const data=await r.json();if(!r.ok)throw Object.assign(new Error(data.error||'Sign-in unavailable.'),{status:r.status});return data;
}
function refresh(){return refreshing??=(session('refresh').then(data=>{if(accountId&&data.accountId!==accountId)throw new Error('Account changed. Reload to continue. Your draft is kept.');return data;}).finally(()=>{refreshing=null;}));}
function note(message){const el=document.getElementById('syncStatus');if(el)el.textContent=message;}
async function start(){
 const configResponse=await originalFetch('/api/auth/config',{cache:'no-store'}),config=await configResponse.json();
 if(!configResponse.ok)throw new Error(config.error||'Sign-in unavailable.');mode=config.mode;
 if(mode==='supabase'){
  const data=await refresh();accountId=data.accountId;
  window.fetch=async(input,init={})=>{
   const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);
   if(url.origin!==location.origin||!url.pathname.startsWith('/api/')||url.pathname.startsWith('/api/auth/'))return originalFetch(input,init);
   const headers=new Headers(init.headers??(input instanceof Request?input.headers:undefined));headers.set('x-leeway-account',accountId);
   let r=await originalFetch(input,{...init,headers});
   if(r.status===401){try{await refresh();r=await originalFetch(input,{...init,headers});}catch{note('Sign-in expired. Your draft is kept. Open Account to sign in again.');}}
   return r;
  };
  const link=document.querySelector('a[href="/leeway-account"]');if(link)link.textContent='LeewayPB sign-in';
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void refresh().catch(e=>note(e.message));});
 }
 window.PaddleLogSession={async signOut(){if(mode==='supabase'){await session('signout');channel?.postMessage('signed-out');location.replace('/leeway-account');}else location.href='/signout-with-chatgpt?return_to=%2F';}};
 await import('/app.js?v=catalog1');
}
start().catch(e=>{
 if(e.status===401){location.replace('/leeway-account');return;}
 document.body.replaceChildren();const main=document.createElement('main');main.style.cssText='padding:24px;max-width:520px;margin:auto';
 const title=document.createElement('h1');title.textContent='Open your paddle library';const p=document.createElement('p');p.textContent=e.message;
 const retry=document.createElement('button');retry.textContent='Retry';retry.style.minHeight='48px';retry.addEventListener('click',()=>location.reload());
 const login=document.createElement('a');login.href='/leeway-account';login.textContent='Sign in to LeewayPB';login.style.cssText='display:block;padding:20px 0';
 main.append(title,p,retry,login);document.body.append(main);
});
