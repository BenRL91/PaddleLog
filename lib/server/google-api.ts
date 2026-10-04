import type {PlayApi,PlaySubscription} from './google-sync';
/** Server-only transport. The credential provider must obtain a short-lived Google
 * service-account access token scoped to androidpublisher; never accept it from a user. */
export function createPlayApi(accessToken:()=>Promise<string>,fetcher:typeof fetch=fetch):PlayApi{
 const root='https://androidpublisher.googleapis.com/androidpublisher/v3/applications/';
 async function call(path:string,method='GET'){
  const token=await accessToken();if(!token)throw new Error('Play verification is not configured.');
  const response=await fetcher(root+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(method==='POST'?{body:'{}'}:{}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('Play verification is temporarily unavailable. Retry restore.');
  return method==='GET'?response.json():undefined;
 }
 return {
  async get(packageName,purchaseToken){return await call(encodeURIComponent(packageName)+'/purchases/subscriptionsv2/tokens/'+encodeURIComponent(purchaseToken)) as PlaySubscription;},
  async acknowledge(packageName,productId,purchaseToken){await call(encodeURIComponent(packageName)+'/purchases/subscriptions/'+encodeURIComponent(productId)+'/tokens/'+encodeURIComponent(purchaseToken)+':acknowledge','POST');}
 };
}
