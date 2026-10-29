import {picklePointAccount,paddleLibraryProjection} from '@/lib/server/picklepoint-integration';
import {readLibrary} from '@/lib/server/library';
import {failure} from '@/lib/server/account';
import {syncDigest} from '@/public/picklepoint-sync.js';
export async function GET(req:Request){try{const a=await picklePointAccount(req),row=await readLibrary(a.id),state=JSON.parse(row?.payload??'{"paddles":[],"settings":{}}'),body=await paddleLibraryProjection(state,row?.revision??0);const etag='"'+await syncDigest({scope:a.id,...body})+'"',headers={'Cache-Control':'private, no-store','ETag':etag,'Vary':'Authorization, Origin'};if(req.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers});return Response.json(body,{headers});}catch(e){return failure(e);}}
