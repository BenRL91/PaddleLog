import {account,failure} from '@/lib/server/account';
export async function GET(req:Request){try{const a=await account(false,req);return Response.json({id:a.id},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
