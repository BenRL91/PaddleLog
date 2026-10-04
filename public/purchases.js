// No provider can grant access locally. This service is unused until configured.
export function purchasing(provider,server,accountId){
 let busy=false;
 return {
  products:()=>provider.products(),
  async purchase(id){if(busy)throw new Error('Purchase already in progress');busy=true;try{const result=await provider.purchase(id,accountId);if(result.status!=='verified-on-device')return result;const sync=await server.verifyAndSync(accountId,result.signedTransaction);await provider.finish(sync.transactionId);return {status:'complete',grants:sync.grants};}finally{busy=false;}},
  async restore(){if(busy)throw new Error('Purchase already in progress');busy=true;try{const results=[];for(const signed of await provider.restore()){const sync=await server.verifyAndSync(accountId,signed);results.push(...sync.grants);await provider.finish(sync.transactionId);}return results;}finally{busy=false;}}
 };
}
