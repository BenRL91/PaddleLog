import {hasPaddleLifePro} from './entitlements.js';
// In-memory, account-bound state. No cached client claim can authorize a server write.
export function entitlementClient(fetcher=fetch,clock=Date.now){
 let accountId=null,grants=[],verifiedAt=0,unknown=true,generation=0,canUseDevelopment=false,developmentMode=null;
 return {
  useAccount(id){if(id!==accountId){accountId=id;canUseDevelopment=false;developmentMode=null;grants=[];verifiedAt=0;unknown=true;generation++;}},
  clear(){accountId=null;canUseDevelopment=false;developmentMode=null;grants=[];verifiedAt=0;unknown=true;generation++;},
  snapshot(){return {accountId,canUseDevelopment,developmentMode,grants:structuredClone(grants),pro:hasPaddleLifePro(grants,clock()),unknown,verifiedAt};},
  async refresh(){const id=accountId,seq=generation;if(!id)throw new Error('Sign in to check your plan.');
   try{const response=await fetcher('/api/entitlements',{cache:'no-store'});if(!response.ok)throw new Error('Could not check your plan. Existing data remains available.');const data=await response.json();if(seq!==generation||data.accountId!==id)throw new Error('Account changed. Reopen the app.');grants=data.grants;canUseDevelopment=data.canUseDevelopment===true;developmentMode=canUseDevelopment?data.developmentMode:null;verifiedAt=clock();unknown=false;return this.snapshot();}
   catch(e){if(seq===generation)unknown=true;throw e;}
  }
 };
}
