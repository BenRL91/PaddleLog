import {account,failure} from '@/lib/server/account';
import {OWNER_ACCOUNT_ID} from '@/lib/server/test-access';
import {grantsFor,developmentMode} from '@/lib/server/entitlements';
import {billingConfig} from '@/public/billing-config.js';
import {hasPaddleLifePro} from '@/public/entitlements.js';
export async function GET(req?:Request){try{const a=await account(false,req);const grants=await grantsFor(a.id);return Response.json({accountId:a.id,canUseDevelopment:a.id===OWNER_ACCOUNT_ID,developmentMode:await developmentMode(a.id),pro:hasPaddleLifePro(grants),grants,freePaddles:billingConfig.freePaddles,purchasesEnabled:billingConfig.purchasesEnabled},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
