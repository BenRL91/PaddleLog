import {storage} from '@/db/store';
import type {VerifiedIdentity} from './external-identity';
export async function externalAccount(identity:VerifiedIdentity){
 const db=storage(),subject=JSON.stringify(['external',identity.issuer,identity.subject]);
 // Atomic batch prevents creation racing with authenticated owner linking.
 await db.batch([
  db.prepare("INSERT OR IGNORE INTO leeway_accounts(id,subject,status) SELECT ?,?,'active' WHERE NOT EXISTS(SELECT 1 FROM leeway_identities WHERE issuer=? AND subject=?)").bind(crypto.randomUUID(),subject,identity.issuer,identity.subject),
  db.prepare('INSERT OR IGNORE INTO leeway_identities(issuer,subject,account_id) SELECT ?,?,id FROM leeway_accounts WHERE subject=?').bind(identity.issuer,identity.subject,subject)
 ]);
 return db.prepare('SELECT a.id,a.status,a.legacy_owner FROM leeway_accounts a JOIN leeway_identities i ON i.account_id=a.id WHERE i.issuer=? AND i.subject=?').bind(identity.issuer,identity.subject).first<{id:string,status:string,legacy_owner:number}>();
}
export async function linkExternalIdentity(accountId:string,identity:VerifiedIdentity){
 const db=storage();
 await db.prepare("INSERT OR IGNORE INTO leeway_identities(issuer,subject,account_id) SELECT ?,?,id FROM leeway_accounts WHERE id=? AND status='active'").bind(identity.issuer,identity.subject,accountId).run();
 const row=await db.prepare('SELECT account_id FROM leeway_identities WHERE issuer=? AND subject=?').bind(identity.issuer,identity.subject).first<{account_id:string}>();
 if(row?.account_id!==accountId)throw new Error('That sign-in is already linked to another account. No data or subscription was moved.');
 return {accountId,linked:true};
}
