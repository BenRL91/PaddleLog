import {env} from 'cloudflare:workers';
import {AccountError} from '@/lib/server/account';
import type {AppleVerifier,VerifiedAppleTransaction} from './apple-sync';
export async function configuredAppleVerifier(){
 if(env.APPLE_BILLING_ENABLED!=='true'||!env.APPLE_BUNDLE_ID||!env.APPLE_ROOT_CERTIFICATES_JSON||!env.APPLE_ISSUER_ID||!env.APPLE_KEY_ID||!env.APPLE_PRIVATE_KEY||!['Sandbox','Production'].includes(env.APPLE_ENVIRONMENT??''))throw new AccountError(503,'Apple purchases are not configured yet. No account data was changed.');
 const environment=env.APPLE_ENVIRONMENT as 'Sandbox'|'Production';
 const appId=env.APPLE_APP_ID?Number(env.APPLE_APP_ID):undefined;
 if(environment==='Production'&&(!appId||!Number.isSafeInteger(appId)))throw new AccountError(503,'Apple verification configuration is incomplete.');
 const certificates:unknown=JSON.parse(env.APPLE_ROOT_CERTIFICATES_JSON);
 if(!Array.isArray(certificates)||!certificates.length||certificates.some(x=>typeof x!=='string'))throw new AccountError(503,'Apple trust configuration is incomplete.');
 // Official Apple verifier checks certificate chain, JWS signatures and app/environment.
 // Online certificate revocation checks remain enabled. Never use client-provided roots.
 const {SignedDataVerifier,Environment,AppStoreServerAPIClient,Status}=await import('@apple/app-store-server-library');
 const decoder=new SignedDataVerifier(certificates.map(x=>Buffer.from(x,'base64')),true,environment==='Production'?Environment.PRODUCTION:Environment.SANDBOX,env.APPLE_BUNDLE_ID,appId);
 const api=new AppStoreServerAPIClient(env.APPLE_PRIVATE_KEY,env.APPLE_KEY_ID,env.APPLE_ISSUER_ID,env.APPLE_BUNDLE_ID,environment==='Production'?Environment.PRODUCTION:Environment.SANDBOX);
 const verifier:AppleVerifier={async verify(jws){
  const submitted=await decoder.verifyAndDecodeTransaction(jws);
  if(submitted.type!=='Auto-Renewable Subscription'||!submitted.originalTransactionId||!submitted.appAccountToken)throw new Error('Unsupported transaction');
  // A valid historical JWS alone does not prove an unrefunded, current subscription.
  const response=await api.getAllSubscriptionStatuses(submitted.originalTransactionId);
  const latest=response.data?.flatMap(group=>group.lastTransactions??[]).find(item=>item.originalTransactionId===submitted.originalTransactionId);
  if(!latest?.signedTransactionInfo)throw new Error('Current subscription status unavailable');
  const t=await decoder.verifyAndDecodeTransaction(latest.signedTransactionInfo);
  if(t.appAccountToken?.toLowerCase()!==submitted.appAccountToken.toLowerCase()||t.originalTransactionId!==submitted.originalTransactionId)throw new Error('Subscription ownership mismatch');
  let expires=t.expiresDate,signedAt=t.signedDate;
  if(latest.status===Status.BILLING_GRACE_PERIOD){
   if(!latest.signedRenewalInfo)throw new Error('Grace period unavailable');
   const renewal=await decoder.verifyAndDecodeRenewalInfo(latest.signedRenewalInfo);
   if(renewal.originalTransactionId!==t.originalTransactionId||!renewal.gracePeriodExpiresDate)throw new Error('Invalid grace period');
   expires=Math.max(expires??0,renewal.gracePeriodExpiresDate);signedAt=Math.max(signedAt??0,renewal.signedDate??0);
  }
  if(latest.status===Status.REVOKED&&!t.revocationDate)throw new Error('Revocation status incomplete');
  return {transactionId:submitted.transactionId,originalTransactionId:t.originalTransactionId,appAccountToken:t.appAccountToken?.toLowerCase(),productId:t.productId,bundleId:t.bundleId,environment:t.environment,purchasedAt:t.purchaseDate,expiresAt:expires,signedAt,revokedAt:t.revocationDate??null} as VerifiedAppleTransaction;
 }};
 return {verifier,decoder,configuration:{bundleId:env.APPLE_BUNDLE_ID,environment}};
}
