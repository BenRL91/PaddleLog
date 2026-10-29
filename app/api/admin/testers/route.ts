import {account,AccountError,failure} from '@/lib/server/account';
import {storage} from '@/db/store';
import {OWNER_ACCOUNT_ID,normalizeTesterEmail} from '@/lib/server/test-access';
import {sameOriginMutation} from '@/lib/server/web-session';
async function owner(req:Request){const a=await account(false,req);if(a.id!==OWNER_ACCOUNT_ID)throw new AccountError(403,'Owner access required.');return a;}
export async function GET(req:Request){try{await owner(req);const result=await storage().prepare('SELECT id,email,admitted,enabled,ends_at AS endsAt,account_id AS accountId,updated_at AS updatedAt FROM tester_access ORDER BY email').all();const history=await storage().prepare('SELECT email,admitted,enabled,ends_at AS endsAt,at FROM tester_access_audit ORDER BY at DESC LIMIT 50').all();return Response.json({testers:result.results,history:history.results},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){try{
 const a=await owner(req);if(!sameOriginMutation(req))throw new AccountError(403,'Same-origin confirmation required.');const raw=await req.text();if(raw.length>20000)throw new AccountError(413,'Request too large.');let input,emails:string[];try{input=JSON.parse(raw);const values=input.emails??[input.email];if(!Array.isArray(values)||values.length<1||values.length>50)throw Error();emails=[...new Set(values.map(normalizeTesterEmail))];}catch{throw new AccountError(400,'Enter a valid email address.');}
 if(input.admitted!==undefined&&typeof input.admitted!=='boolean')throw new AccountError(400,'Choose beta access On or Off.');const admitted=input.admitted===undefined?null:input.admitted?1:0;
 if(typeof input.enabled!=='boolean')throw new AccountError(400,'Choose On or Off.');const endsAt=input.endsAt??null;if(endsAt!==null&&(!Number.isSafeInteger(endsAt)||endsAt<=Date.now()))throw new AccountError(400,'Expiration must be in the future.');
 const db=storage(),now=Date.now();await db.batch(emails.flatMap(email=>[
 db.prepare('INSERT INTO tester_access(id,email,admitted,enabled,ends_at,created_at,updated_at,updated_by) VALUES(?,?,COALESCE(?,1),?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET admitted=COALESCE(?,tester_access.admitted),enabled=excluded.enabled,ends_at=excluded.ends_at,updated_at=excluded.updated_at,updated_by=excluded.updated_by').bind(crypto.randomUUID(),email,admitted,input.enabled?1:0,endsAt,now,now,a.id,admitted),
 db.prepare("UPDATE entitlement_grants SET revoked_at=?,ends_at=?,verified_at=? WHERE source='admin_test' AND source_ref IN (SELECT 'tester:'||id FROM tester_access WHERE email=?)").bind(input.enabled?null:now,endsAt,now,email),
 db.prepare('INSERT INTO tester_access_audit(id,actor_id,email,admitted,enabled,ends_at,at) SELECT ?,?,email,admitted,enabled,ends_at,? FROM tester_access WHERE email=?').bind(crypto.randomUUID(),a.id,now,email)
 ]));return Response.json({saved:true,count:emails.length},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
