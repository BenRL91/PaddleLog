import {storage} from '@/db/store';
export const healthCodes=['save_success','save_failed','sync_conflict','backup_failed','backup_prune_failed','load_failed','draft_storage_failed'];
export async function recordHealth(accountId:string,code:string){
 if(!healthCodes.includes(code))return;
 try{const now=new Date(),day=now.toISOString().slice(0,10),cutoff=new Date(now.getTime()-89*86400000).toISOString().slice(0,10),db=storage();await db.batch([
 db.prepare("INSERT INTO health_counters(account_id,day,code,count,last_at) SELECT ?,?,?,1,? WHERE EXISTS(SELECT 1 FROM leeway_accounts WHERE id=? AND status='active') ON CONFLICT(account_id,day,code) DO UPDATE SET count=MIN(health_counters.count+1,10000),last_at=excluded.last_at").bind(accountId,day,code,now.toISOString(),accountId),
 db.prepare('DELETE FROM health_counters WHERE account_id=? AND day<?').bind(accountId,cutoff)]);
 }catch{console.error('PaddleLog health counter unavailable',code);}
}
export async function healthSummary(accountId:string){const cutoff=new Date(Date.now()-6*86400000).toISOString().slice(0,10);const {results}=await storage().prepare('SELECT day,code,count,last_at FROM health_counters WHERE account_id=? AND day>=? ORDER BY day DESC').bind(accountId,cutoff).all();const totals:any={};for(const row of results as any[])totals[row.code]=(totals[row.code]??0)+row.count;return {period:'Last 7 days (UTC)',totals,days:results};}
