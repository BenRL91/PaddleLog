import {readLibrary} from '@/lib/server/library';
import {account,failure} from '@/lib/server/account';
export async function GET(req?:Request){try{const a=await account(false,req);const row=await readLibrary(a.id);return Response.json({...JSON.parse(row?.payload??'{"version":2,"paddles":[],"sessions":[],"usagePeriods":[],"catalog":[]}'),exportedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store','Content-Disposition':'attachment; filename="paddlelog-backup.json"'}});}catch(e){return failure(e);}}
