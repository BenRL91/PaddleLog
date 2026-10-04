import {registerPlugin} from '@capacitor/core';
import {billingConfig} from '../public/billing-config.js';
import type {PurchaseProvider,PurchaseProduct} from '../shared/contracts';
interface ApplePlugin {
 products(options:{ids:string[]}):Promise<{products:PurchaseProduct[]}>;
 purchase(options:{productId:string;appAccountToken:string}):ReturnType<PurchaseProvider['purchase']>;
 restore():Promise<{transactions:string[]}>;
 finish(options:{transactionId:string}):Promise<void>;
 addListener(event:'transaction',handler:(event:{signedTransaction:string})=>void):Promise<{remove():Promise<void>}>;
}
const plugin=registerPlugin<ApplePlugin>('PaddleLifePurchases');
export const applePurchases:PurchaseProvider={
 async products(){return (await plugin.products({ids:Object.values(billingConfig.products).map(p=>p.id)})).products;},
 purchase(productId,appAccountToken){return plugin.purchase({productId,appAccountToken});},
 async restore(){return (await plugin.restore()).transactions;},
 finish(transactionId){return plugin.finish({transactionId});}
};
export async function observeAppleTransactions(sync:(jws:string)=>Promise<{transactionId:string}>){return plugin.addListener('transaction',async({signedTransaction})=>{try{const result=await sync(signedTransaction);await applePurchases.finish(result.transactionId);}catch{/* Leave unfinished; StoreKit redelivers, and Restore retries. */}});}
