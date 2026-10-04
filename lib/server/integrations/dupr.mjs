// Server-only Partner API adapter. No route exposes this until verified SSO linking exists.
export class DuprError extends Error {
 constructor(code,status=503){super(code);this.code=code;this.status=status;}
}
export function createDuprClient({baseUrl,clientKey,clientSecret,fetcher=fetch,clock=Date.now}={}){
 let cached=null;
 function configured(){
  if(!baseUrl||!clientKey||!clientSecret)throw new DuprError('DUPR_PARTNER_NOT_CONFIGURED');
  const u=new URL(baseUrl);
  if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||!['uat.mydupr.com','prod.mydupr.com'].includes(u.hostname)||u.pathname.replace(/\/$/,'')!=='/api')throw new DuprError('DUPR_CONFIGURATION_INVALID');
  return u.href.replace(/\/$/,'');
 }
 async function request(path,options){
  let r;try{r=await fetcher(configured()+path,{...options,redirect:'error',signal:AbortSignal.timeout(10000)});}catch(e){if(e instanceof DuprError)throw e;throw new DuprError('DUPR_UNAVAILABLE');}
  if(!r.ok)throw new DuprError(r.status===429?'DUPR_RATE_LIMITED':r.status===401||r.status===403?'DUPR_ACCESS_REQUIRED':'DUPR_UNAVAILABLE',r.status);
  let body;try{body=await r.json();}catch{throw new DuprError('DUPR_INVALID_RESPONSE');}
  if(body.status!=='SUCCESS'||!body.result)throw new DuprError('DUPR_INVALID_RESPONSE');
  return body.result;
 }
 async function token(){
  if(cached&&cached.expires>clock()+60000)return cached.value;
  const result=await request('/auth/v1.0/token',{method:'POST',headers:{'x-authorization':btoa(clientKey+':'+clientSecret)}});
  const expires=Date.parse(result.expiry);
  if(typeof result.token!=='string'||!result.token||!Number.isFinite(expires)||expires<=clock())throw new DuprError('DUPR_INVALID_TOKEN');
  cached={value:result.token,expires:Math.min(expires,clock()+3600000)};return cached.value;
 }
 return {async player(verifiedConnection){
  // The caller must obtain this connection from trusted server-side SSO storage,
  // never from a request's arbitrary profile ID or an email match.
  if(!verifiedConnection?.accountId||verifiedConnection.status!=='verified'||!verifiedConnection.linkedAt||! /^[A-Z0-9]{1,6}$/.test(verifiedConnection.duprId??''))throw new DuprError('DUPR_VERIFIED_LINK_REQUIRED',403);
  const bearer=await token();
  const result=await request('/user/v1.0/'+encodeURIComponent(verifiedConnection.duprId),{headers:{Authorization:'Bearer '+bearer}});
  if(result.duprId!==verifiedConnection.duprId)throw new DuprError('DUPR_IDENTITY_MISMATCH',403);
  return result;
 },clearToken(){cached=null;}};
}
