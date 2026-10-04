import {billingConfig} from './billing-config.js';
import {hasPaddleLifePro} from './entitlements.js';
export const activePaddles=state=>state.paddles.filter(p=>(p.status??'active')==='active');
export function authorizePaddleChange(before,after,grants,now=Date.now(),limit=billingConfig.freeActivePaddles){
 if(hasPaddleLifePro(grants,now))return {allowed:true};
 const existing=new Set(activePaddles(before).map(p=>p.id));
 const active=activePaddles(after);
 // Existing over-limit libraries remain editable. Reactivation is an addition too.
 const activated=active.some(p=>!existing.has(p.id));
 return activated&&active.length>limit?{allowed:false,code:'ACTIVE_PADDLE_LIMIT',feature:'unlimitedPaddles',limit,message:`Free includes ${limit} active paddles. Retire an active paddle or upgrade to Pro. Your existing paddles and draft remain safe.`}:{allowed:true};
}
export function featureAccess(feature,grants,now=Date.now()){
 if(!(feature in billingConfig.features)||!billingConfig.features[feature])return {allowed:false,available:false};
 return {allowed:billingConfig.freeFeatures.includes(feature)||hasPaddleLifePro(grants,now),available:true};
}
