import {nativeOrigins} from './native-cors.mjs';
export const picklePointIntegrationPath='/api/integrations/pickle-point/';
export function picklePointOrigins(config={}){try{const values=JSON.parse(config.PADDLELOG_PICKLEPOINT_ORIGINS_JSON??'[]');return Array.isArray(values)?values.filter(x=>{try{const u=new URL(x);return u.protocol==='https:'&&u.origin===x&&!u.username&&!u.password;}catch{return false;}}):[];}catch{return [];}}
// This boundary alone permits opt-in cross-app browser calls, with bearer tokens
// rather than cookies. No origin setting changes any shared auth infrastructure.
export function picklePointCors(request,config={}){
 const url=new URL(request.url);if(!url.pathname.startsWith(picklePointIntegrationPath))return null;
 const origin=request.headers.get('origin'),external=origin&&origin!==url.origin;
 const method=url.pathname==='/api/integrations/pickle-point/sessions'?'POST':'GET';
 if(external&&![...picklePointOrigins(config),...nativeOrigins(config)].includes(origin))return {headers:null,response:Response.json({error:'Integration origin is not enabled.'},{status:403,headers:{'Cache-Control':'no-store'}})};
 const headers=external?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':method+',OPTIONS','Access-Control-Allow-Headers':'authorization,content-type,if-none-match','Access-Control-Expose-Headers':'etag','Access-Control-Max-Age':'600','Vary':'Origin, Authorization','Cache-Control':'private, no-store'}:null;
 if(request.method==='OPTIONS'){const wanted=(request.headers.get('access-control-request-headers')??'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);if(!external||request.headers.get('access-control-request-method')!==method||wanted.some(x=>!['authorization','content-type','if-none-match'].includes(x)))return {headers:null,response:new Response(null,{status:403})};return {headers,response:new Response(null,{status:204,headers})};}
 return {headers,response:null};
}
