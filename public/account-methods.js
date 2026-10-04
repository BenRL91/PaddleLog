const $=id=>document.getElementById(id);let accountId=null;
async function request(url,body){const r=await fetch(url,{cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json','x-leeway-session':'1'},body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(data.error||'Could not load account.');return data;}
async function load(){
 $('addGoogle').disabled=$('addApple').disabled=true;
 try{
  const config=await request('/api/auth/config');const canonical=new URL(config.redirectTo).origin;if(canonical!==location.origin){location.replace(canonical+'/account');return;}
  if(config.mode!=='supabase')throw Error('Sign in with LeewayPB to manage connected methods.');
  await request('/api/auth/session',{action:'refresh'});
  const data=await request('/api/auth/methods');accountId=data.accountId;$('accountSignIn').hidden=true;$('accountEmail').textContent=data.email||'Your LeewayPB account';$('methods').replaceChildren();
  for(const method of data.methods){const li=document.createElement('li');li.textContent=({google:'Google',apple:'Apple',email:'Email'})[method.provider]||method.provider;if(method.email)li.textContent+=' · '+method.email;$('methods').append(li);}
  for(const provider of ['google','apple']){const b=$(provider==='google'?'addGoogle':'addApple');const connected=data.methods.some(m=>m.provider===provider);b.disabled=connected||!config.providers[provider];b.textContent=(provider==='google'?'Google':'Apple')+(connected?' — connected':config.providers[provider]?' — connect':' — not available yet');}
  $('cancelLink').hidden=!config.pendingLink;
  const q=new URLSearchParams(location.search);$('methodStatus').textContent=q.has('linked')?'Sign-in method connected. Your paddle library is unchanged.':q.has('cancelled')?'Connection cancelled. Your existing sign-in methods remain available.':'Your connected sign-in methods are up to date.';history.replaceState(null,'','/account');
 }catch(e){$('accountSignIn').hidden=false;$('methodStatus').textContent=e.message;}
}
for(const provider of ['google','apple'])$(provider==='google'?'addGoogle':'addApple').addEventListener('click',async()=>{
 if(!confirm('Connect '+(provider==='google'?'Google':'Apple')+' to this LeewayPB account? Your existing paddle library will stay with this account.'))return;
 $('addGoogle').disabled=$('addApple').disabled=true;$('methodStatus').textContent='Opening provider verification…';
 try{const data=await request('/api/auth/methods',{action:'start',provider,accountId});location.assign(data.url);}catch(e){await load();$('methodStatus').textContent=e.message;}
});
$('cancelLink').addEventListener('click',async()=>{try{await request('/api/auth/methods',{action:'cancel'});await load();}catch(e){$('accountSignIn').hidden=false;$('methodStatus').textContent=e.message;}});
$('retryMethods').addEventListener('click',load);void load();
