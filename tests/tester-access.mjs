import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
import {webcrypto} from 'node:crypto';
const db=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync('drizzle/'+f,'utf8'));
const storage=()=>({prepare(sql){let args=[];return {bind(...v){args=v;return this;},async run(){return db.prepare(sql).run(...args);},async first(){return db.prepare(sql).get(...args);},async all(){return {results:db.prepare(sql).all(...args)}}}},async batch(statements){db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}});
function module(file,globals){let source=readFileSync(file,'utf8').replace(/^import .*;\n/gm,'');const compiled=ts.transpile(source,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});const exports={};vm.runInNewContext(compiled,{exports,storage,Date,Response,Request,URL,crypto:webcrypto,...globals});return exports;}
const helper=module('lib/server/test-access.ts');
assert.equal(helper.normalizeTesterEmail(' contact@example.invalid '),'tester@example.invalid');assert.throws(()=>helper.normalizeTesterEmail('bad'));
await helper.claimTestAccess('unverified');assert.equal(db.prepare('SELECT count(*) n FROM entitlement_grants').get().n,0);
await helper.claimTestAccess('christine','tester@example.invalid');assert.equal(db.prepare('SELECT account_id FROM tester_access').get().account_id,'christine');
await helper.claimTestAccess('other','tester@example.invalid');assert.equal(db.prepare('SELECT count(*) n FROM entitlement_grants').get().n,1);assert.equal(db.prepare('SELECT account_id FROM entitlement_grants').get().account_id,'christine');
let signedIn={id:helper.OWNER_ACCOUNT_ID};class AccountError extends Error{constructor(status,message){super(message);this.status=status;}}
const api=module('app/api/admin/testers/route.ts',{...helper,account:async()=>{if(!signedIn)throw new AccountError(401,'Sign in');return signedIn;},AccountError,failure:e=>Response.json({error:e.message},{status:e.status??503}),sameOriginMutation:r=>r.headers.get('origin')===new URL(r.url).origin&&r.headers.get('x-leeway-session')==='1'});
const get=()=>api.GET(new Request('https://paddlelog.leewaypb.com/api/admin/testers'));
signedIn=null;assert.equal((await get()).status,401);signedIn={id:'christine'};assert.equal((await get()).status,403);signedIn={id:helper.OWNER_ACCOUNT_ID};assert.equal((await get()).status,200);
const post=(data,origin='https://paddlelog.leewaypb.com')=>api.POST(new Request('https://paddlelog.leewaypb.com/api/admin/testers',{method:'POST',headers:{origin,'x-leeway-session':'1'},body:JSON.stringify(data)}));
assert.equal((await post({email:'tester@example.invalid',enabled:false},'https://evil.example')).status,403);
assert.equal((await post({email:'bad',enabled:true})).status,400);assert.equal((await post({email:'contact@example.invalid',enabled:true,endsAt:1})).status,400);
db.prepare("INSERT INTO entitlement_grants VALUES('paid','christine','paddlelog_pro','apple','paid',0,NULL,NULL,0,'{}')").run();
assert.equal((await post({email:'tester@example.invalid',enabled:false})).status,200);await helper.claimTestAccess('christine','tester@example.invalid');assert.ok(db.prepare("SELECT revoked_at FROM entitlement_grants WHERE source='admin_test'").get().revoked_at);assert.equal(db.prepare("SELECT revoked_at FROM entitlement_grants WHERE source='apple'").get().revoked_at,null);
assert.equal((await post({email:'tester@example.invalid',enabled:true,endsAt:Date.now()+100000})).status,200);assert.equal(db.prepare("SELECT revoked_at FROM entitlement_grants WHERE source='admin_test'").get().revoked_at,null);assert.equal(db.prepare('SELECT count(*) n FROM tester_access_audit').get().n,2);
assert.equal((await post({email:'contact@example.invalid',enabled:true,endsAt:Date.now()+10000})).status,200);db.prepare("UPDATE tester_access SET ends_at=1 WHERE email='contact@example.invalid'").run();await helper.claimTestAccess('expired','contact@example.invalid');assert.equal(db.prepare("SELECT account_id FROM tester_access WHERE email='contact@example.invalid'").get().account_id,null);
console.log('Tester access: migrations, verified-email claiming, stable account binding, owner authorization, CSRF, validation, revocation, reactivation, expiration, paid-grant preservation, and audit passed.');
