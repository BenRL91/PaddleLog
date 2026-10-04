import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {purchasingPlatform} from '../native/platform-policy.js';
assert.equal(purchasingPlatform('android'),'google');assert.equal(purchasingPlatform('ios'),'apple');assert.equal(purchasingPlatform('web'),null);
// Exercise the actual TypeScript coordinator with Node's type stripping.
const {googlePurchasing}=await import('../native/google-purchases.ts');
let state='purchased',verified=0;
const bridge={products:async()=>[],purchase:async()=>state==='purchased'?{status:state,proof:{provider:'google',purchaseToken:'test-token',productId:'paddlelog_pro'}}:{status:state},restore:async()=>[{provider:'google',purchaseToken:'test-token',productId:'paddlelog_pro'}]};
const server={verifyAndSync:async()=>{verified++;return {grants:[{key:'paddlelife_pro'}]};}};
const service=googlePurchasing(bridge,server,'account-a');
for(const status of ['pending','cancelled']){state=status;assert.equal((await service.purchase('annual')).status,status);assert.equal(verified,0);}
state='purchased';assert.equal((await service.purchase('annual')).status,'complete');assert.equal(verified,1);
assert.equal((await service.restore()).length,1);
await assert.rejects(service.purchase('bogus'),/Unknown/);
const failing=googlePurchasing(bridge,{verifyAndSync:async()=>{throw Error('Offline');}},'a');await assert.rejects(failing.purchase('monthly'),/Offline/);
let release;const blocked=googlePurchasing({...bridge,purchase:()=>new Promise(resolve=>{release=resolve;})},server,'a');const first=blocked.purchase('annual');await assert.rejects(blocked.purchase('annual'),/progress/);release({status:'cancelled'});await first;
assert.match(readFileSync('native/bootstrap.ts','utf8'),/purchasingPlatform\(Capacitor.getPlatform\(\)\)===\'apple\'/);
console.log('Android platform isolation, verified purchase boundary, pending/cancel/failure, restore and double-tap tests passed');
