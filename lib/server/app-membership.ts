import {storage} from '@/db/store';

export const PADDLELOG_APP_ID='paddlelog' as const;
export type AppMembership={account_id:string;app_id:string;role:string;status:string;created_at:number;updated_at:number};

export async function ensurePaddleLogMembership(accountId:string){
 const db=storage(),now=Date.now();
 await db.prepare("INSERT OR IGNORE INTO app_memberships(account_id,app_id,role,status,created_at,updated_at) VALUES (?,'paddlelog','member','active',?,?)").bind(accountId,now,now).run();
 return db.prepare("SELECT account_id,app_id,role,status,created_at,updated_at FROM app_memberships WHERE account_id=? AND app_id='paddlelog'").bind(accountId).first<AppMembership>();
}

export async function paddleLogMembership(accountId:string){
 return storage().prepare("SELECT account_id,app_id,role,status,created_at,updated_at FROM app_memberships WHERE account_id=? AND app_id='paddlelog'").bind(accountId).first<AppMembership>();
}
