/** Stable internal UUIDs, independent of ChatGPT, Apple or payment customers. */
export type AccountId = string;
export type EntitlementKey = 'paddlelog_pro'|'paddlelife_pro'|'performance_pro'|'coach_pro'|'tournament_pro'|'leeway_all_access';
export interface EntitlementGrant {id:string;accountId:AccountId;key:EntitlementKey;source:'apple'|'google'|'stripe'|'promotion'|'lifetime'|'admin'|'ecosystem';sourceRef:string;startsAt:number;endsAt:number|null;revokedAt:number|null}
export interface Identity {accountId:AccountId;issuer:string;subject:string}
export interface AuthAdapter {currentAccount():Promise<{id:AccountId}|null>;signIn():Promise<void>;signOut():Promise<void>;accessToken():Promise<string|null>}
export interface SecureTokenStore {get(key:string):Promise<string|null>;set(key:string,value:string):Promise<void>;remove(key:string):Promise<void>}
export interface PurchaseProduct {id:string;displayName:string;displayPrice:string;price:number;currency:string;period:'month'|'year'}
export interface PurchaseProvider {
 products():Promise<PurchaseProduct[]>;
 purchase(productId:string,appAccountToken:AccountId):Promise<{status:'cancelled'|'pending'}|{status:'verified-on-device';signedTransaction:string}>;
 restore():Promise<string[]>;
 finish(transactionId:string):Promise<void>;
}
export interface TransactionVerifier {
 // Server-only: verify Apple JWS certificate chain, bundle/environment/product IDs,
 // appAccountToken binding, expiration, revocation and replay before granting access.
 verifyAndSync(account:AccountId,signedTransaction:string):Promise<{transactionId:string;grants:EntitlementGrant[]}>;
}
export interface NativeCapabilities {
 camera():Promise<Blob>;share(file:Blob,name:string):Promise<void>;haptic():Promise<void>;
 onResume(callback:()=>void):()=>void;onNetwork(callback:(online:boolean)=>void):()=>void;
 // Push registration is opt-in and requires configured APNs and a backend token registry.
 registerPush():Promise<string>;
}
