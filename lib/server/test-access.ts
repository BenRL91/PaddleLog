import {storage} from '@/db/store';
export const OWNER_ACCOUNT_ID='00000000-0000-4000-8000-000000000001';
export function normalizeTesterEmail(value:unknown){if(typeof value!=='string')throw Error('Enter an email address.');const email=value.trim().toLowerCase();if(email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid email address.');return email;}
// Email claims allocate a test grant only. They never link identities or libraries.
export async function claimTestAccess(accountId:string,email?:string){
 if(!email)return;const db=storage(),now=Date.now();
 await db.batch([
 db.prepare('UPDATE tester_access SET account_id=? WHERE email=? AND account_id IS NULL AND enabled=1 AND (ends_at IS NULL OR ends_at>?)').bind(accountId,email.toLowerCase(),now),
 db.prepare("INSERT INTO entitlement_grants(id,account_id,key,source,source_ref,starts_at,ends_at,revoked_at,verified_at,metadata) SELECT id,account_id,'paddlelog_pro','admin_test','tester:'||id,created_at,ends_at,NULL,?, '{\"billing\":\"none\",\"purpose\":\"Owner-authorized testing\"}' FROM tester_access WHERE email=? AND account_id=? AND enabled=1 AND (ends_at IS NULL OR ends_at>?) ON CONFLICT(source_ref) DO UPDATE SET ends_at=excluded.ends_at,revoked_at=NULL,verified_at=excluded.verified_at WHERE entitlement_grants.account_id=excluded.account_id").bind(now,email.toLowerCase(),accountId,now)
 ]);
}

// Admission is independent of complimentary Pro. Only provider-verified email can
// bind a pending invitation; the resulting account binding never follows email reuse.
export async function admitBetaAccount(accountId:string,email?:string){
 if(accountId===OWNER_ACCOUNT_ID)return true;
 const db=storage();
 if(email)await db.prepare('UPDATE tester_access SET account_id=? WHERE email=? AND account_id IS NULL AND admitted=1').bind(accountId,email.trim().toLowerCase()).run();
 const row=await db.prepare('SELECT id FROM tester_access WHERE account_id=? AND admitted=1 LIMIT 1').bind(accountId).first();
 return !!row;
}
export const betaAdmissionMessage='PaddleLog beta is invite-only. Sign in with your invited email, or contact leewaypb@gmail.com for access. Your saved library and drafts have not changed.';
