import {env} from 'cloudflare:workers';
import {account,failure} from '@/lib/server/account';
import fallback from '@/public/competition-data.json';
// These object keys have no user-write endpoint. Only the trusted admin publishing
// process may supply rules, official approvals or physical measurement attestations.
export async function GET(req?:Request){try{
 const a=await account(false,req);const object=await env.BUCKET?.get('competition/published.json');
 const data=object?await object.json<typeof fallback>():fallback;
 if(data.schemaVersion!==1||!Array.isArray(data.rulesets)||!Array.isArray(data.approvals)||!Array.isArray(data.configurationApprovals))throw Error('Rules unavailable');
 const verified=await env.BUCKET?.get('verified-specs/'+a.id+'.json');
 const measurements=verified?await verified.json():[];if(!Array.isArray(measurements))throw Error('Measurement attestations unavailable');
 return Response.json({...data,verifiedMeasurements:measurements},{headers:{'Cache-Control':'private, no-store'}});
}catch(e){return failure(e);}}
