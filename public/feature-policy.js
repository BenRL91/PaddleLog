import {billingConfig} from './billing-config.js';
import {hasPaddleLifePro} from './entitlements.js';
export const activePaddles=state=>state.paddles.filter(p=>(p.status??'active')==='active');
export function authorizePaddleChange(before,after,grants,now=Date.now(),limit=billingConfig.freePaddles){
 if(hasPaddleLifePro(grants,now))return {allowed:true};
 for(const [key,feature] of [['comparisons','comparisons'],['experiments','setupExperiments']]){const old=new Map((before.settings?.proWorkspace?.[key]??[]).map(r=>[r.id,r]));if((after.settings?.proWorkspace?.[key]??[]).some(r=>JSON.stringify(old.get(r.id))!==JSON.stringify(r)))return {allowed:false,code:'PRO_REQUIRED',feature,message:'Saving '+(key==='experiments'?'setup experiments':'comparisons')+' requires Pro. Your existing records remain safe.'};}
 const existing=new Set(before.paddles.map(p=>p.id));
 const added=after.paddles.some(p=>!existing.has(p.id));
 // Existing over-limit collections remain editable; every status counts for additions.
 return added&&after.paddles.length>limit?{allowed:false,code:'PADDLE_LIMIT',feature:'unlimitedPaddles',limit,message:`Free includes ${limit} paddles total, including inactive and archived paddles. Delete a paddle or upgrade to Pro to add another. Your existing paddles and draft remain safe.`}:{allowed:true};
}
export function featureAccess(feature,grants,now=Date.now()){
 if(!(feature in billingConfig.features)||!billingConfig.features[feature])return {allowed:false,available:false};
 return {allowed:billingConfig.freeFeatures.includes(feature)||hasPaddleLifePro(grants,now),available:true};
}
