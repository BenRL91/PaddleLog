import {storage} from '@/db/store';
import {grantsFor} from './entitlements';
/** Implemented against Google subscriptionsv2 server responses. The transport must
 * authenticate with Play Console credentials; NEVER pass client JSON as a response. */
export interface PlayApi {
 get(packageName:string,purchaseToken:string):Promise<PlaySubscription>;
 acknowledge(packageName:string,productId:string,purchaseToken:string):Promise<void>;
}
export interface PlaySubscription {
 startTime?:string;subscriptionState:string;acknowledgementState:string;
 externalAccountIdentifiers?:{obfuscatedExternalAccountId?:string};testPurchase?:object;
 lineItems?:Array<{productId:string;expiryTime:string;offerDetails?:{basePlanId?:string}}>;
 linkedPurchaseToken?:string;
}
export async function syncGooglePurchase(accountId:string,token:string,api:PlayApi,config:{packageName:string;productId:string;basePlanIds:string[];allowTestPurchases:boolean},now=Date.now()){
 if(!config.packageName||!token||token.length>16384)throw new Error('Invalid purchase verification request');
 const p=await api.get(config.packageName,token);
 if(p.externalAccountIdentifiers?.obfuscatedExternalAccountId!==accountId)throw new Error('Subscription belongs to a different account.');
 if(p.testPurchase&&!config.allowTestPurchases)throw new Error('Test purchase is not accepted in this environment.');
 const item=p.lineItems?.filter(i=>i.productId===config.productId&&config.basePlanIds.includes(i.offerDetails?.basePlanId??'')).sort((a,b)=>Date.parse(b.expiryTime)-Date.parse(a.expiryTime))[0];
 if(!item)throw new Error('Unknown subscription product or base plan.');
 const startsAt=Date.parse(p.startTime??''),expiresAt=Date.parse(item.expiryTime);
 const usable=['SUBSCRIPTION_STATE_ACTIVE','SUBSCRIPTION_STATE_CANCELED','SUBSCRIPTION_STATE_IN_GRACE_PERIOD'].includes(p.subscriptionState);
 const stopped=['SUBSCRIPTION_STATE_EXPIRED','SUBSCRIPTION_STATE_PAUSED','SUBSCRIPTION_STATE_ON_HOLD'].includes(p.subscriptionState);
 if(!usable&&!stopped)throw new Error('Purchase is pending or its state cannot be verified.');
 if(!Number.isFinite(startsAt)||!Number.isFinite(expiresAt)||expiresAt<=startsAt||startsAt>now)throw new Error('Invalid subscription dates.');
 if(!['ACKNOWLEDGEMENT_STATE_PENDING','ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED'].includes(p.acknowledgementState))throw new Error('Unknown acknowledgement state.');
 const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
 const ref='google:'+config.packageName+':'+await hash(token),db=storage();
 await db.prepare("INSERT INTO entitlement_grants(id,account_id,key,source,source_ref,starts_at,ends_at,revoked_at,verified_at,metadata) SELECT ?,?,'paddlelog_pro','google',?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM leeway_accounts WHERE id=? AND status='active') ON CONFLICT(source_ref) DO UPDATE SET starts_at=excluded.starts_at,ends_at=excluded.ends_at,revoked_at=excluded.revoked_at,verified_at=excluded.verified_at,metadata=excluded.metadata WHERE entitlement_grants.account_id=excluded.account_id AND excluded.verified_at>entitlement_grants.verified_at").bind(crypto.randomUUID(),accountId,ref,startsAt,expiresAt,stopped?now:null,now,JSON.stringify({productId:item.productId,basePlanId:item.offerDetails?.basePlanId,state:p.subscriptionState,test:!!p.testPurchase}),accountId).run();
 const grant=await db.prepare('SELECT account_id FROM entitlement_grants WHERE source_ref=?').bind(ref).first<{account_id:string}>();
 if(grant?.account_id!==accountId)throw new Error('Subscription ownership could not be synchronized.');
 // A replaced token must no longer keep Pro independently alive. Only revoke the
 // predecessor if it was already owned by this same authenticated account.
 if(p.linkedPurchaseToken&&usable){const oldRef='google:'+config.packageName+':'+await hash(p.linkedPurchaseToken);await db.prepare('UPDATE entitlement_grants SET revoked_at=?,verified_at=? WHERE source_ref=? AND account_id=? AND verified_at<?').bind(now,now,oldRef,accountId,now).run();}
 // Acknowledgement is AFTER durable entitlement persistence; a failed ACK is retryable.
 if(usable&&p.acknowledgementState==='ACKNOWLEDGEMENT_STATE_PENDING')await api.acknowledge(config.packageName,item.productId,token);
 return {accountId,grants:await grantsFor(accountId)};
}
