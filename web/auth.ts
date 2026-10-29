import {resumeExistingSession} from './login-session.js';
import {createClient} from '@supabase/supabase-js';
import {createConnection} from './auth-controller.js';
import {connectionStorage,authErrorMessage} from './auth-storage.js';
const $=(id:string)=>document.getElementById(id)!;
const status=(text:string)=>{$('authStatus').textContent=text;};
async function start(){
 const query=new URLSearchParams(location.search),code=query.get('code'),error=query.get('error');
 if(location.search||location.hash)history.replaceState(null,'','/leeway-account');
 const response=await fetch('/api/auth/config',{credentials:'same-origin'});const config=await response.json() as {pendingLink?:boolean;mode?:string;error?:string;accountId:string;url:string;publishableKey:string;redirectTo:string;providers:Record<string,boolean>;linked:boolean};
 if(!response.ok)throw new Error(config.error||'Sign-in unavailable.');
 // Start new PKCE requests on the configured origin so the callback finds its verifier.
 const canonical=new URL(config.redirectTo);
 if(!code&&!error&&config.mode==='supabase'&&canonical.origin!==location.origin){location.replace(canonical.origin+'/leeway-account');return;}
 if(config.pendingLink&&(code||error)){
  const r=await fetch('/api/auth/methods',{method:'POST',headers:{'Content-Type':'application/json','x-leeway-session':'1'},body:JSON.stringify(error?{action:'cancel'}:{action:'complete',code})});const result=await r.json() as {error?:string};
  if(!r.ok)throw new Error(result.error||'Account linking failed. Return to Account and retry.');
  location.replace('/account?'+(error?'cancelled=1':'linked=1'));return;
 }
 if(await resumeExistingSession({mode:config.mode,hasCallback:!!(code||error)})){location.replace('/');return;}
 $('authControls').hidden=false;
 const storage=connectionStorage({persistent:localStorage,legacyTab:sessionStorage,accountId:config.accountId});
 const client=createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:false,persistSession:true,storage,storageKey:'leewaypb-connect',autoRefreshToken:false}});
 const connection=createConnection({client,config});
 $('linkState').textContent=config.linked?'A LeewayPB identity is already linked to this library. You can verify another sign-in to connect it explicitly.':'This library has not yet been linked to LeewayPB.';
 if(config.mode==='supabase'){$('intro').textContent='Your paddles, sessions and history, all in one place.';$('accessNote').textContent='Invite-only beta. Use your invited email with an available sign-in method. No ChatGPT account is required.';$('linkState').textContent='Email, Google and Apple use your shared LeewayPB identity.';}
 const confirmed=async(user:{email?:string;id:string})=>{if(config.mode==='supabase'){status('Opening your library…');await connection.signIn();storage.clearSession();location.replace('/');return;}$('verifiedEmail').textContent=user.email||user.id;$('confirmConnection').hidden=false;$('authControls').hidden=true;status('Sign-in verified. Review the account above before linking.');};
 let actionBusy=false;
 const action=async(button:HTMLButtonElement,task:()=>Promise<void>)=>{if(actionBusy||button.disabled)return;actionBusy=true;const controls=[...document.querySelectorAll<HTMLButtonElement>('button')],previous=controls.map(control=>control.disabled);controls.forEach(control=>control.disabled=true);$('authControls').setAttribute('aria-busy','true');try{await task();}catch(e){status(authErrorMessage(e));}finally{controls.forEach((control,index)=>control.disabled=previous[index]);$('authControls').removeAttribute('aria-busy');actionBusy=false;}};
 for(const provider of ['google','apple']){const b=$(provider+'Auth') as HTMLButtonElement;b.disabled=!config.providers[provider];if(!b.disabled)b.textContent='Continue with '+(provider==='apple'?'Apple':'Google');b.addEventListener('click',()=>action(b,async()=>{status('Opening sign-in…');location.assign(await connection.oauth(provider));}));}
 const send=$('sendCode') as HTMLButtonElement,verify=$('verifyCode') as HTMLButtonElement;send.disabled=verify.disabled=!config.providers.email;
 $('emailAuth').addEventListener('submit',e=>{e.preventDefault();void action(send,async()=>{await connection.sendEmail(($('authEmail') as HTMLInputElement).value);$('codeAuth').hidden=false;status('Check your email. Enter the code below, or open the newest sign-in link in this same browser. A new tab is okay.');});});
 $('codeAuth').addEventListener('submit',e=>{e.preventDefault();void action(verify,async()=>confirmed(await connection.verifyCode(($('authEmail') as HTMLInputElement).value,($('authCode') as HTMLInputElement).value)));});
 $('linkAccount').addEventListener('click',()=>action($('linkAccount') as HTMLButtonElement,async()=>{await connection.link();$('confirmConnection').hidden=true;status('Your LeewayPB account is connected. Your paddle library and subscription account were preserved. Return to PaddleLog to continue.');$('linkState').textContent='LeewayPB account connected.';storage.clearSession();}));
 $('cancelConnection').addEventListener('click',()=>action($('cancelConnection') as HTMLButtonElement,async()=>{await connection.cancel();$('confirmConnection').hidden=true;$('authControls').hidden=false;status('Choose the sign-in method you want to connect.');}));
 if(error)status('Sign-in was cancelled or could not complete. Try again.');else if(code){status('Verifying your sign-in…');await confirmed(await connection.callback(code));}else status('');
}
void start().catch(e=>status(authErrorMessage(e)));
