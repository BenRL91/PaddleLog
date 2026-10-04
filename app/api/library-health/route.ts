import {healthSummary} from '@/lib/server/health';
import {account,failure} from '@/lib/server/account';
import {readLibrary} from '@/lib/server/library';
import {sessionUsage} from '@/public/maintenance.js';
export async function GET(req:Request){try{const a=await account(false,req),row=await readLibrary(a.id),s=JSON.parse(row?.payload??'{"paddles":[],"sessions":[],"usagePeriods":[],"catalog":[]}');return Response.json({activity:await healthSummary(a.id),revision:row?.revision??0,storage:row?.normalized?'records':'legacy',paddles:s.paddles.length,sessions:s.sessions.length,maintenance:s.paddles.reduce((n:any,p:any)=>n+(p.maintenance?.length??0),0),usagePeriods:s.usagePeriods.length,catalog:s.catalog.length,lifetimeHours:s.paddles.reduce((n:any,p:any)=>n+sessionUsage(p.id,s.sessions),0)},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return failure(e);}}
