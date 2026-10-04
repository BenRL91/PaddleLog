import {grantsFor} from '@/lib/server/entitlements';
import {storage} from '@/db/store';
import {billingConfig} from '@/public/billing-config.js';
/** Output of a cryptographic verifier, never a decoded/untrusted client payload. */
export interface VerifiedAppleTransaction {transactionId:string;originalTransactionId:string;appAccountToken:string;productId:string;bundleId:string;environment:'Sandbox'|'Production';purchasedAt:number;expiresAt:number;signedAt:number;revokedAt:number|null}
export interface AppleVerifier {verify(jws:string):Promise<VerifiedAppleTransaction>}
export async function syncAppleTransaction(accountId:string,jws:string,verifier:AppleVerifier,configuration:{bundleId:string;environment:'Sandbox'|'Production'}){
 const t=await verifier.verify(jws);
 if(t.appAccountToken!==accountId||t.bundleId!==configuration.bundleId||t.environment!==configuration.environment||!Object.values(billingConfig.products).some(p=>p.id===t.productId))throw new Error('Transaction does not belong to this account or product.');
 if(!t.transactionId||!t.originalTransactionId||![t.purchasedAt,t.expiresAt,t.signedAt].every(Number.isFinite)||t.expiresAt<=t.purchasedAt||t.signedAt>Date.now()+300000||t.revokedAt!==null&&!Number.isFinite(t.revokedAt))throw new Error('Invalid verified transaction.');
 const db=storage(),ref='apple:'+t.environment+':'+t.originalTransactionId;
 // Unique provider reference prevents assigning a subscription to a different account.
 // signedAt makes notification retries and out-of-order delivery safe.
 const result=await db.prepare("INSERT INTO entitlement_grants(id,account_id,key,source,source_ref,starts_at,ends_at,revoked_at,verified_at,metadata) SELECT ?,?,'paddlelog_pro','apple',?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM leeway_accounts WHERE id=? AND status='active') ON CONFLICT(source_ref) DO UPDATE SET starts_at=excluded.starts_at,ends_at=excluded.ends_at,revoked_at=excluded.revoked_at,verified_at=excluded.verified_at,metadata=excluded.metadata WHERE entitlement_grants.account_id=excluded.account_id AND (excluded.starts_at>entitlement_grants.starts_at OR (excluded.starts_at=entitlement_grants.starts_at AND excluded.verified_at>entitlement_grants.verified_at))").bind(crypto.randomUUID(),accountId,ref,t.purchasedAt,t.expiresAt,t.revokedAt,t.signedAt,JSON.stringify({productId:t.productId,transactionId:t.transactionId,environment:t.environment}),accountId).run();
 const grant=await db.prepare('SELECT account_id FROM entitlement_grants WHERE source_ref=?').bind(ref).first<{account_id:string}>();
 if(!grant||grant.account_id!==accountId)throw new Error('Subscription ownership could not be synchronized.');
 return {transactionId:t.transactionId,updated:!!result.meta.changes,grants:await grantsFor(accountId)};
}
