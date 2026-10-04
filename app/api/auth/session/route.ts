import {linkHeader} from '@/lib/server/sign-in-methods';
import {env} from 'cloudflare:workers';
import {cookie,refreshCookie,sameOriginMutation,sessionHeaders,refreshWebSession} from '@/lib/server/web-session';
import {externalAccount} from '@/lib/server/identity-map';
export async function POST(req:Request){
 if(!sameOriginMutation(req))return Response.json({error:'Same-origin confirmation required.'},{status:403});
 if(env.LEEWAY_AUTH_MODE!=='supabase')return Response.json({mode:'sites'},{headers:{'Cache-Control':'no-store'}});
 let input;try{const raw=await req.text();if(raw.length>20000)throw Error();input=JSON.parse(raw);}catch{return Response.json({error:'Invalid session request.'},{status:400});}
 if(input.action==='signout'){const headers=sessionHeaders();headers.append('Set-Cookie',linkHeader());return Response.json({signedOut:true},{headers});}
 if(!['refresh','signin'].includes(input.action))return Response.json({error:'Unknown session action.'},{status:400});
 const token=input.action==='signin'?input.refreshToken:cookie(req,refreshCookie);
 if(typeof token!=='string'||!token)return Response.json({error:'Sign in to LeewayPB.'},{status:401,headers:sessionHeaders()});
 try{
  const {session,identity}=await refreshWebSession(token,env),a=await externalAccount(identity);
  if(!a||a.status!=='active')return Response.json({error:'Account unavailable.'},{status:409,headers:sessionHeaders()});
  return Response.json({mode:'supabase',accountId:a.id},{headers:sessionHeaders(session)});
 }catch{return Response.json({error:'Session could not be renewed. Retry or sign in again; your library and drafts are safe.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
