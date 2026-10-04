import {writeRecovery,pruneBackups} from '@/lib/server/recovery';
import {env} from 'cloudflare:workers';
import {storage} from '@/db/store';
const canonical=(x:any):any=>x&&typeof x==='object'?(Array.isArray(x)?x.map(canonical):Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])]))):x;
// The legacy account_logs row is retained untouched as the pre-migration recovery copy.
export const libraryTables=['user_paddles','user_sessions','user_usage_periods','user_catalog','user_maintenance'];
export function splitLibrary(state:any){
 const metadata={...state};const records:any={};
 for(const [key,table] of [['paddles','user_paddles'],['sessions','user_sessions'],['usagePeriods','user_usage_periods'],['catalog','user_catalog']]){
  delete metadata[key];records[table]=(state[key]??[]).map((value:any,position:number)=>({id:key==='catalog'?String(position):value.id,paddleId:value.paddleId??null,position,value:structuredClone(value)}));
 }
 records.user_maintenance=[];
 for(const row of records.user_paddles){const p=row.value;if(Array.isArray(p.maintenance)){for(const [position,event] of p.maintenance.entries())records.user_maintenance.push({id:JSON.stringify([p.id,event.id]),paddleId:p.id,position,value:event});row.value={paddle:p,hasMaintenance:true};delete row.value.paddle.maintenance;}else row.value={paddle:p,hasMaintenance:false};}
 return {metadata,records};
}
export function joinLibrary(metadata:any,records:any){
 const state={...metadata,paddles:[],sessions:[],usagePeriods:[],catalog:[]};
 for(const [key,table] of [['paddles','user_paddles'],['sessions','user_sessions'],['usagePeriods','user_usage_periods'],['catalog','user_catalog']])state[key]=records[table].map((row:any)=>key==='paddles'?row.value.paddle:row.value);
 for(const [i,p] of state.paddles.entries())if(records.user_paddles[i].value.hasMaintenance)p.maintenance=records.user_maintenance.filter((row:any)=>row.paddleId===p.id).map((row:any)=>row.value);
 return state;
}
export async function readLibrary(accountId:string){
 const db=storage();
 // Read individual rows without aggregating a library back into a large SQLite cell.
 // Check the revision again to reject mixed snapshots from a concurrent commit.
 for(let attempt=0;attempt<3;attempt++){
  const row:any=await db.prepare('SELECT metadata,revision FROM account_libraries WHERE account_id=?').bind(accountId).first();
  if(!row)break;
  const records:any={};
  for(const t of libraryTables){const result=await db.prepare(`SELECT id,paddle_id AS paddleId,position,payload FROM ${t} WHERE account_id=? ORDER BY position`).bind(accountId).all();records[t]=result.results.map((r:any)=>({...r,value:JSON.parse(r.payload)}));}
  const check:any=await db.prepare('SELECT revision FROM account_libraries WHERE account_id=?').bind(accountId).first();
  if(check?.revision===row.revision)return {payload:JSON.stringify(joinLibrary(JSON.parse(row.metadata),records)),revision:row.revision,normalized:true};
 }
 const exists=await db.prepare('SELECT revision FROM account_libraries WHERE account_id=?').bind(accountId).first();if(exists)throw Error('Library changed while loading; retry');
 return await db.prepare('SELECT payload,revision FROM account_logs WHERE account_id=?').bind(accountId).first<{payload:string;revision:number;normalized?:boolean}>();
}
export async function saveLibrary(accountId:string,state:any,revision:number,current:any){
 const db=storage(),next=splitLibrary(state),before=current?.normalized?splitLibrary(JSON.parse(current.payload)):null;
 // Verify the reversible migration before touching records. No IDs or wear counters change.
 if(JSON.stringify(canonical(joinLibrary(next.metadata,structuredClone(next.records))))!==JSON.stringify(canonical(state)))throw Error('Library migration verification failed');
 // Back up only the previously confirmed revision. A failed backup blocks this save.
 // These account-scoped R2 objects are purged by account deletion.
 await writeRecovery(accountId,current);
 const token=crypto.randomUUID(),now=new Date().toISOString();
 const statements=[db.prepare("INSERT OR IGNORE INTO account_libraries(account_id,metadata,revision,token,updated_at) SELECT ?,?,?,'',? WHERE EXISTS(SELECT 1 FROM leeway_accounts WHERE id=? AND status='active')").bind(accountId,JSON.stringify({}),revision,now,accountId),db.prepare("UPDATE account_libraries SET metadata=?,revision=revision+1,token=?,updated_at=? WHERE account_id=? AND revision=? AND EXISTS(SELECT 1 FROM leeway_accounts WHERE id=? AND status='active')").bind(JSON.stringify(next.metadata),token,now,accountId,revision,accountId)];
 // Every write is guarded by the successful CAS token, within the same atomic D1 batch.
 for(const table of libraryTables){const previous=new Map((before?.records[table]??[]).map((r:any)=>[r.id,r]));const ids=new Set(next.records[table].map((r:any)=>r.id));
  for(const row of next.records[table]){if(JSON.stringify(previous.get(row.id))===JSON.stringify(row))continue;
   statements.push(db.prepare(`INSERT INTO ${table}(account_id,id,paddle_id,position,payload) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM account_libraries WHERE account_id=? AND token=?) ON CONFLICT(account_id,id) DO UPDATE SET paddle_id=excluded.paddle_id,position=excluded.position,payload=excluded.payload`).bind(accountId,row.id,row.paddleId,row.position,JSON.stringify(row.value),accountId,token));}
  for(const id of previous.keys())if(!ids.has(id))statements.push(db.prepare(`DELETE FROM ${table} WHERE account_id=? AND id=? AND EXISTS(SELECT 1 FROM account_libraries WHERE account_id=? AND token=?)`).bind(accountId,id,accountId,token));
 }
 const results=await db.batch(statements);const changed=!!results[1].meta.changes;if(changed)await pruneBackups(accountId);return changed;
}
