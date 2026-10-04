import {env} from 'cloudflare:workers';
import {account,failure} from '@/lib/server/account';
import {sameOriginMutation,sessionHeaders} from '@/lib/server/web-session';
import {methodClient,beginMethodLink,completeMethodLink,linkHeader} from '@/lib/server/sign-in-methods';
export async function GET(req:Request){try{const a=await account(false,req);const user=await methodClient(req,env).user();return Response.json({accountId:a.id,email:user.email??null,methods:(user.identities??[]).map(i=>({provider:i.provider,email:typeof i.identity_data?.email==='string'?i.identity_data.email:null}))},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){
 if(!sameOriginMutation(req))return Response.json({error:'Same-origin confirmation required.'},{status:403});
 try{
  const a=await account(false,req);if(env.LEEWAY_AUTH_MODE!=='supabase')return Response.json({error:'LeewayPB sign-in is required.'},{status:409});
  const raw=await req.text();if(raw.length>12000)return Response.json({error:'Request is too large.'},{status:413});let input;try{input=JSON.parse(raw);}catch{return Response.json({error:'Invalid request.'},{status:400});}
  if(input.action==='cancel')return Response.json({cancelled:true},{headers:{'Set-Cookie':linkHeader(),'Cache-Control':'no-store'}});
  if(input.action==='start'){
   if(input.accountId!==a.id)return Response.json({error:'Account changed. Reload before linking.'},{status:409});
   if(!['google','apple'].includes(input.provider))return Response.json({error:'Unsupported sign-in method.'},{status:400});
   const result=await beginMethodLink(req,env,input.provider,env.LEEWAY_WEB_ORIGIN+'/auth/return');
   return Response.json({url:result.url},{headers:{'Set-Cookie':linkHeader(result.pending),'Cache-Control':'no-store'}});
  }
  if(input.action==='complete'&&typeof input.code==='string'&&input.code.length<4000){const session=await completeMethodLink(req,env,input.code);const headers=sessionHeaders(session);headers.append('Set-Cookie',linkHeader());return Response.json({linked:true,accountId:a.id},{headers});}
  return Response.json({error:'Unknown account action.'},{status:400});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Account linking unavailable.'},{status:400,headers:{'Cache-Control':'no-store'}});}
}
