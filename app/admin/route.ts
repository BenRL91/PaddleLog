import html from './admin.html?raw';
import {account,AccountError,failure} from '@/lib/server/account';
import {OWNER_ACCOUNT_ID} from '@/lib/server/test-access';
export async function GET(req:Request){try{const a=await account(false,req);if(a.id!==OWNER_ACCOUNT_ID)throw new AccountError(403,'Owner access required.');return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});}catch(e){return failure(e);}}
