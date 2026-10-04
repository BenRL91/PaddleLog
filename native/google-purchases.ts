/** Play Billing boundary. The Android plugin and server verifier must be configured
 * before enabling this adapter. Purchase tokens never grant local entitlements. */
import type {PurchaseProduct,EntitlementGrant} from '../shared/contracts';
export interface GooglePurchaseProof {provider:'google';purchaseToken:string;productId:string}
export interface GoogleBillingBridge {
 products(plans:typeof googlePlans):Promise<PurchaseProduct[]>;
 purchase(plan:string,accountId:string):Promise<{status:'cancelled'|'pending'}|{status:'purchased';proof:GooglePurchaseProof}>;
 restore():Promise<GooglePurchaseProof[]>;
}
export interface GoogleVerifier {
 // Server must query subscriptionsv2, bind obfuscatedExternalAccountId, check
 // package/product/base plan, expiry and revocation, persist grant then acknowledge.
 verifyAndSync(accountId:string,proof:GooglePurchaseProof):Promise<{grants:EntitlementGrant[]}>;
}
// Proposed Play Console identifiers, not provisioned products. Prices come from Play.
export const googlePlans={annual:{productId:'paddlelog_pro',basePlanId:'annual'},monthly:{productId:'paddlelog_pro',basePlanId:'monthly'}} as const;
export function googlePurchasing(bridge:GoogleBillingBridge,server:GoogleVerifier,accountId:string){
 let busy=false;
 return {
 products:()=>bridge.products(googlePlans),
 async purchase(plan:string){
  if(!(plan in googlePlans))throw new Error('Unknown subscription plan');
  if(busy)throw new Error('Purchase already in progress');busy=true;
  try{const result=await bridge.purchase(plan,accountId);if(result.status!=='purchased')return result;const verified=await server.verifyAndSync(accountId,result.proof);return {status:'complete',grants:verified.grants};}finally{busy=false;}
 },
 async restore(){if(busy)throw new Error('Purchase already in progress');busy=true;try{const grants:EntitlementGrant[]=[];for(const proof of await bridge.restore())grants.push(...(await server.verifyAndSync(accountId,proof)).grants);return grants;}finally{busy=false;}}
 };
}
