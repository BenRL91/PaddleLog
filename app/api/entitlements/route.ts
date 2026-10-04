import {account,failure} from '@/lib/server/account';
import {grantsFor} from '@/lib/server/entitlements';
import {billingConfig} from '@/public/billing-config.js';
import {hasPaddleLifePro} from '@/public/entitlements.js';
export async function GET(req?:Request){try{const a=await account(false,req);const grants=await grantsFor(a.id);return Response.json({accountId:a.id,pro:hasPaddleLifePro(grants),grants,freeActivePaddles:billingConfig.freeActivePaddles,purchasesEnabled:billingConfig.purchasesEnabled},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
