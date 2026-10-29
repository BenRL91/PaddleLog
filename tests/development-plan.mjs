import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
import {webcrypto} from 'node:crypto';
const db=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync('drizzle/'+f,'utf8'));
const storage=()=>({prepare(sql){let args=[];return {bind(...v){args=v;return this;},async run(){return db.prepare(sql).run(...args);},async first(){return db.prepare(sql).get(...args);},async all(){return {results:db.prepare(sql).all(...args)}}}},async batch(statements){db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}});
function module(file,globals){let source=readFileSync(file,'utf8').replace(/^import .*;\n/gm,'');const compiled=ts.transpile(source,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});const exports={};vm.runInNewContext(compiled,{exports,storage,Date,Response,Request,URL,crypto:webcrypto,...globals});return exports;}
import {hasPaddleLogPro} from '../public/entitlements.js';
const OWNER_ACCOUNT_ID='00000000-0000-4000-8000-000000000001';
let signedIn={id:OWNER_ACCOUNT_ID};class AccountError extends Error{constructor(status,message){super(message);this.status=status;}}
const api=module('app/api/admin/development-plan/route.ts',{OWNER_ACCOUNT_ID,account:async()=>{if(!signedIn)throw new AccountError(401,'Sign in');return signedIn;},AccountError,failure:e=>Response.json({error:e.message},{status:e.status??503}),sameOriginMutation:r=>r.headers.get('origin')===new URL(r.url).origin&&r.headers.get('x-leeway-session')==='1'});
const entitlements=module('lib/server/entitlements.ts',{OWNER_ACCOUNT_ID});
const post=(mode,origin='https://site.test')=>api.POST(new Request('https://site.test/api/admin/development-plan',{method:'POST',headers:{origin,'x-leeway-session':'1'},body:JSON.stringify({mode})}));
signedIn=null;assert.equal((await post('pro')).status,401);signedIn={id:'other'};assert.equal((await post('pro')).status,403);signedIn={id:OWNER_ACCOUNT_ID};assert.equal((await post('pro','https://evil.test')).status,403);assert.equal((await post('invalid')).status,400);
db.prepare("INSERT INTO entitlement_grants VALUES('paid',?,'paddlelog_pro','apple','paid',0,NULL,NULL,0,'{}')").run(OWNER_ACCOUNT_ID);
assert.equal((await post('free')).status,200);assert.equal(hasPaddleLogPro(await entitlements.grantsFor(OWNER_ACCOUNT_ID)),false);assert.equal(await entitlements.developmentMode(OWNER_ACCOUNT_ID),'free');
assert.equal((await post('pro')).status,200);assert.equal(hasPaddleLogPro(await entitlements.grantsFor(OWNER_ACCOUNT_ID)),true);
assert.equal((await post('actual')).status,200);assert.equal(await entitlements.developmentMode(OWNER_ACCOUNT_ID),'actual');assert.equal(hasPaddleLogPro(await entitlements.grantsFor(OWNER_ACCOUNT_ID)),true);assert.equal(db.prepare("SELECT revoked_at FROM entitlement_grants WHERE source='apple'").get().revoked_at,null);
assert.equal(await entitlements.developmentMode('other'),null);assert.equal(db.prepare("SELECT count(*) n FROM entitlement_grants WHERE source='owner_development'").get().n,1);
console.log('PASS: owner-only test plan, CSRF rejection, validated modes, Free override of paid access, Pro and actual-plan restoration, subscription preservation.');
