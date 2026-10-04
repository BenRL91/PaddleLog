import {libraryTables} from '@/lib/server/library';
import {env} from 'cloudflare:workers';
import {account,failure,crossSite} from '@/lib/server/account';
import {storage} from '@/db/store';
export async function DELETE(req:Request){
 if(crossSite(req)||req.headers.get('x-confirm-delete')!=='delete-my-account')return Response.json({error:'Confirmation required.'},{status:400});
 try{const a=await account(true,req),db=storage();if(!env.BUCKET)throw new Error('Photos unavailable');
 await db.prepare("UPDATE leeway_accounts SET status='deleting' WHERE id=?").bind(a.id).run();
 // Mark first, then purge. Interrupted deletion is safe to retry; writes are refused.
 for(const prefix of ['accounts/'+a.id+'/',...(a.legacy_owner?['paddle-photos/']:[])]){let cursor:string|undefined;do{const page=await env.BUCKET.list({prefix,cursor});if(page.objects.length)await env.BUCKET.delete(page.objects.map(x=>x.key));cursor=page.truncated?page.cursor:undefined;}while(cursor);}
 await db.batch([
 ...libraryTables.map(t=>db.prepare(`DELETE FROM ${t} WHERE account_id=?`).bind(a.id)),
 db.prepare('DELETE FROM health_counters WHERE account_id=?').bind(a.id),
 db.prepare('DELETE FROM account_libraries WHERE account_id=?').bind(a.id),
 db.prepare('DELETE FROM account_logs WHERE account_id=?').bind(a.id),
 db.prepare('DELETE FROM account_photos WHERE account_id=?').bind(a.id),
 db.prepare('DELETE FROM entitlement_grants WHERE account_id=?').bind(a.id),
 ...(a.legacy_owner?[db.prepare('DELETE FROM paddle_logs WHERE id=1')]:[]),
 db.prepare('DELETE FROM leeway_identities WHERE account_id=?').bind(a.id),
 db.prepare('DELETE FROM leeway_accounts WHERE id=?').bind(a.id)
 ]);return Response.json({deleted:true,accountId:a.id});
 }catch(e){return failure(e);}
}
