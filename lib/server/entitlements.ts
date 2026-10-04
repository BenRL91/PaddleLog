import {storage} from '@/db/store';
export async function grantsFor(accountId:string){const result=await storage().prepare('SELECT key,starts_at AS startsAt,ends_at AS endsAt,revoked_at AS revokedAt FROM entitlement_grants WHERE account_id=?').bind(accountId).all();return result.results;}
