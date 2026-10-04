import type {TransactionVerifier,EntitlementGrant} from '../shared/contracts';
// Native bootstrap replaces fetch with the authenticated HTTPS API transport.
export const transactionServer:TransactionVerifier={async verifyAndSync(accountId,signedTransaction){
 const response=await fetch('/api/billing/apple',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({signedTransaction})});
 if(!response.ok)throw new Error('Purchase verification could not complete. Restore purchases to retry.');
 const result=await response.json() as {transactionId:string;grants:EntitlementGrant[]};return {transactionId:result.transactionId,grants:result.grants};
}};
