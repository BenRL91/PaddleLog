import {picklePointAccount} from '@/lib/server/picklepoint-integration';
import {readLibrary} from '@/lib/server/library';
import {failure,AccountError} from '@/lib/server/account';
import {GET as getPhoto} from '@/app/api/photos/route';
export async function GET(req:Request){try{const a=await picklePointAccount(req),row=await readLibrary(a.id),id=new URL(req.url).searchParams.get('physicalPaddleId'),p=JSON.parse(row?.payload??'{"paddles":[]}').paddles.find((x:any)=>x.id===id);if(!p?.photoId)throw new AccountError(404,'Paddle image unavailable.');const url=new URL(req.url);url.pathname='/api/photos';url.search='';url.searchParams.set('id',p.photoId);return getPhoto(new Request(url,req));}catch(e){return failure(e);}}
