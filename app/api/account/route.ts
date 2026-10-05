import {libraryTables} from '@/lib/server/library';
import {env} from 'cloudflare:workers';
import {account,failure,crossSite} from '@/lib/server/account';
import {storage} from '@/db/store';
export async function DELETE(req:Request){
 if(crossSite(req)||req.headers.get('x-confirm-delete')!=='delete-my-account')return Response.json({error:'Confirmation required.'},{status:400});
 try{const a=await account(true,req),db=storage();if(!env.BUCKET)throw new Error('Photos unavailable');
 const now=Date.now();await db.batch([
  db.prepare("INSERT OR IGNORE INTO app_memberships(account_id,app_id,role,status,created_at,updated_at) VALUES (?,'paddlelog','member','deleting',?,?)").bind(a.id,now,now),
  db.prepare("UPDATE app_memberships SET status='deleting',updated_at=? WHERE account_id=? AND app_id='paddlelog'").bind(now,a.id)
 ]);
 // Mark only PaddleLog membership first, then purge PaddleLog-owned data. Interrupted deletion is safe to retry; PaddleLog writes are refused.
 for(const prefix of ['accounts/'+a.id+'/',...(a.legacy_owner?['paddle-photos/']:[])]){let cursor:string|undefined;do{const page=await env.BUCKET.list({prefix,cursor});if(page.objects.length)await env.BUCKET.delete(page.objects.map(x=>x.key));cursor=page.truncated?page.cursor:undefined;}while(cursor);}
 await db.batch([
 ...libraryTables.map(t=>db.prepare(`DELETE FROM ${t} WHERE account_id=?`).bind(a.id)),
 db.prepare('DELETE FROM health_counters WHERE account_id=?').bind(a.id),
 db.prepare('DELETE FROM account_libraries WHERE account_id=?').bind(a.id),
 db.prepare('DELETE FROM account_logs WHERE account_id=?').bind(a.id),
 db.prepare('DELETE FROM account_photos WHERE account_id=?').bind(a.id),
 db.prepare("DELETE FROM entitlement_grants WHERE account_id=? AND key IN ('paddlelog_pro','paddlelife_pro')").bind(a.id),
 ...(a.legacy_owner?[db.prepare('DELETE FROM paddle_logs WHERE id=1')]:[]),
 db.prepare("UPDATE app_memberships SET status='deleted',updated_at=? WHERE account_id=? AND app_id='paddlelog'").bind(Date.now(),a.id),
 // Legacy interrupted PaddleLog deletion may have marked the suite account itself. Restore it; suite identity survives app deletion.
 db.prepare("UPDATE leeway_accounts SET status='active' WHERE id=? AND status='deleting'").bind(a.id)
 ]);return Response.json({deleted:true,accountId:a.id,suiteIdentityPreserved:true});
 }catch(e){return failure(e);}
}
