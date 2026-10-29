import {OWNER_ACCOUNT_ID} from './test-access';
import {storage} from '@/db/store';
export async function grantsFor(accountId:string){const result=await storage().prepare('SELECT key,starts_at AS startsAt,ends_at AS endsAt,revoked_at AS revokedAt FROM entitlement_grants WHERE account_id=?').bind(accountId).all();const grants=result.results;if(accountId===OWNER_ACCOUNT_ID&&grants.some(g=>g.key==='paddlelog_dev_free'&&g.revokedAt==null&&Number(g.startsAt)<=Date.now()&&(g.endsAt==null||Number(g.endsAt)>Date.now())))return [];return grants;}

export async function developmentMode(accountId:string){if(accountId!==OWNER_ACCOUNT_ID)return null;const row=await storage().prepare("SELECT key,revoked_at FROM entitlement_grants WHERE source_ref=?").bind("owner-development:"+accountId).first<{key:string;revoked_at:number|null}>();return !row||row.revoked_at!=null?"actual":row.key==="paddlelog_dev_free"?"free":"pro";}
