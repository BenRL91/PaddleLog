import {nativeOriginAllowed} from '../lib/server/native-cors.mjs';
import {selectBackupRetention,backupPolicy} from '../public/backup-policy.js';
import {applyChanges} from '../public/record-sync.js';
import {billingConfig} from '../public/billing-config.js';
import {authorizePaddleChange,featureAccess} from '../public/feature-policy.js';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
import {validate} from '../public/validate.js';import {photoIdValid,photoType,MAX_PHOTO_BYTES} from '../public/photos.js';
import {sessionUsage} from '../public/maintenance.js';
import {hasPaddleLifePro} from '../public/entitlements.js';
const sql=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+file,'utf8'));
function prepare(query){let args=[];return {bind(...a){args=a;return this;},async first(){return sql.prepare(query).get(...args)??null;},async all(){return {results:sql.prepare(query).all(...args)};},async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:Number(r.changes)}};}};}
const db={prepare,async batch(statements){sql.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
let identity={issuer:'https://auth.test/auth/v1',subject:'uninvited'};let user=null;const objects=new Map();let failDelete=false;const env={BUCKET:{async put(k,bytes,options){objects.set(k,{body:bytes,httpMetadata:options.httpMetadata});},async get(k){const o=objects.get(k);return o?{...o,async json(){return JSON.parse(o.body);}}:null;},async list({prefix}){return {objects:[...objects.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false};},async delete(keys){if(failDelete)throw new Error('Unavailable');for(const key of Array.isArray(keys)?keys:[keys])objects.delete(key);}}};
const deps={sameOriginMutation:req=>req.headers.get('origin')===new URL(req.url).origin&&req.headers.get('x-leeway-session')==='1',nativeOriginAllowed,selectBackupRetention,backupPolicy,applyChanges,sessionUsage,billingConfig,authorizePaddleChange,featureAccess,grantsFor:async id=>(await db.prepare('SELECT key,starts_at AS startsAt,ends_at AS endsAt,revoked_at AS revokedAt FROM entitlement_grants WHERE account_id=?').bind(id).all()).results,storage:()=>db,getChatGPTUser:async()=>user,env,validate,photoIdValid,photoType,MAX_PHOTO_BYTES,hasPaddleLifePro};
async function module(path){let source=fs.readFileSync(path,'utf8').replace(/^import .*;?\s*$/gm,'');source='const {'+Object.keys(deps).join(',')+'}=globalThis.backendDeps;\n'+source;globalThis.backendDeps=deps;const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));}
Object.assign(deps,await module('lib/server/test-access.ts'));delete deps.grantsFor;Object.assign(deps,await module('lib/server/entitlements.ts'));Object.assign(deps,await module('lib/server/identity-map.ts'));deps.verifiedExternalIdentity=async req=>{if(req?.headers.get('authorization')!=='Bearer verified')throw Error('Invalid');return identity;};Object.assign(deps,await module('lib/server/account.ts'));Object.assign(deps,await module('lib/server/health.ts'));Object.assign(deps,await module('lib/server/recovery.ts'));Object.assign(deps,await module('lib/server/library.ts'));const state=await module('app/api/state/route.ts'),photos=await module('app/api/photos/route.ts'),accounts=await module('app/api/account/route.ts'),entitlements=await module('app/api/entitlements/route.ts');

env.LEEWAY_AUTH_MODE='supabase';
const request=(path,method='GET',body)=>new Request('https://test'+path,{method,headers:{authorization:'Bearer verified',origin:'https://test'},...(body?{body:JSON.stringify(body)}:{})});
const exportRoute=await module('app/api/export/route.ts'),backup=await module('app/api/backups/route.ts'),health=await module('app/api/library-health/route.ts'),events=await module('app/api/health/events/route.ts'),authAccount=await module('app/api/auth/account/route.ts');
const surfaces=[()=>state.GET(request('/api/state')),()=>state.PUT(request('/api/state','PUT',{})),()=>state.PATCH(request('/api/state','PATCH',{})),()=>photos.POST(request('/api/photos','POST',{})),()=>photos.GET(request('/api/photos?id='+crypto.randomUUID())),()=>exportRoute.GET(request('/api/export')),()=>backup.GET(request('/api/backups')),()=>health.GET(request('/api/library-health')),()=>events.POST(request('/api/health/events','POST',{code:'draft_storage_failed'})),()=>entitlements.GET(request('/api/entitlements')),()=>authAccount.GET(request('/api/auth/account'))];
for(const run of surfaces)assert.equal((await run()).status,403);
assert.equal(sql.prepare('SELECT count(*) n FROM account_logs').get().n,0);
assert.equal((await state.GET(new Request('https://test/api/state'))).status,401);
sql.prepare("INSERT INTO tester_access(id,email,admitted,enabled,created_at,updated_at,updated_by) VALUES('free-beta','free@example.test',1,0,0,0,'owner')").run();
identity={...identity,subject:'tester-free',verifiedEmail:'free@example.test'};
let r=await state.GET(request('/api/state'));assert.equal(r.status,200);const free=await r.json();assert.equal((await (await entitlements.GET(request('/api/entitlements'))).json()).pro,false);
const library=validate({version:2,paddles:[{id:'own',brand:'Brand',model:'Paddle'}],sessions:[],usagePeriods:[],settings:{}});
assert.equal((await state.PUT(request('/api/state','PUT',{accountId:free.accountId,revision:0,state:library}))).status,200);
const before=await (await exportRoute.GET(request('/api/export'))).json();assert.equal(before.paddles[0].id,'own');
// Email changes cannot move a bound library. A different account cannot claim reused email.
identity={...identity,verifiedEmail:'changed@example.test'};assert.equal((await state.GET(request('/api/state'))).status,200);
identity={...identity,subject:'email-reuser',verifiedEmail:'free@example.test'};assert.equal((await state.GET(request('/api/state'))).status,403);
identity={...identity,subject:'tester-free'};
sql.prepare("UPDATE tester_access SET admitted=0 WHERE id='free-beta'").run();for(const run of surfaces)assert.equal((await run()).status,403);
assert.equal(sql.prepare('SELECT count(*) n FROM user_paddles').get().n,1);
sql.prepare("UPDATE tester_access SET admitted=1 WHERE id='free-beta'").run();assert.equal((await (await state.GET(request('/api/state'))).json()).state.paddles[0].id,'own');
// Unverified provider email cannot claim an invitation.
sql.prepare("INSERT INTO tester_access(id,email,admitted,enabled,created_at,updated_at,updated_by) VALUES('unverified-beta','unverified@example.test',1,1,0,0,'owner')").run();
identity={...identity,subject:'unverified'};delete identity.verifiedEmail;assert.equal((await state.GET(request('/api/state'))).status,403);assert.equal(sql.prepare("SELECT account_id FROM tester_access WHERE id='unverified-beta'").get().account_id,null);
// Owner bypass uses only the fixed internal account mapping, never email or metadata.
sql.prepare("INSERT INTO leeway_accounts(id,subject,status) VALUES (?, 'owner-existing','active')").run(deps.OWNER_ACCOUNT_ID);sql.prepare('INSERT INTO leeway_identities VALUES (?,?,?)').run(identity.issuer,'owner-subject',deps.OWNER_ACCOUNT_ID);sql.prepare('INSERT INTO account_logs VALUES (?,?,9)').run(deps.OWNER_ACCOUNT_ID,JSON.stringify(library));
identity={...identity,subject:'owner-subject'};assert.equal((await (await state.GET(request('/api/state'))).json()).accountId,deps.OWNER_ACCOUNT_ID);
assert.equal((await (await state.GET(request('/api/state'))).json()).state.paddles[0].id,'own');
const admin=await module('app/api/admin/testers/route.ts');
const admPost=body=>admin.POST(new Request('https://test/api/admin/testers',{method:'POST',headers:{authorization:'Bearer verified',origin:'https://test','x-leeway-session':'1'},body:JSON.stringify(body)}));
assert.equal((await admPost({email:'free@example.test',admitted:false,enabled:false})).status,200);assert.equal(sql.prepare("SELECT admitted FROM tester_access WHERE id='free-beta'").get().admitted,0);
// An older owner UI toggling Pro cannot silently restore blocked admission.
assert.equal((await admPost({email:'free@example.test',enabled:true})).status,200);assert.equal(sql.prepare("SELECT admitted FROM tester_access WHERE id='free-beta'").get().admitted,0);
assert.equal((await admPost({email:'free@example.test',admitted:true,enabled:false})).status,200);assert.equal(sql.prepare("SELECT admitted FROM tester_access WHERE id='free-beta'").get().admitted,1);
const history=await (await admin.GET(request('/api/admin/testers'))).json();assert.ok(history.history.some(h=>h.admitted===0));assert.ok(history.history.some(h=>h.admitted===1));
identity={...identity,subject:'tester-free',verifiedEmail:'free@example.test'};assert.equal((await admin.GET(request('/api/admin/testers'))).status,403);
// Pending invitations bind once under concurrent claims, with no libraries merged.
sql.prepare("INSERT INTO tester_access(id,email,admitted,enabled,created_at,updated_at,updated_by) VALUES('race-beta','race@example.test',1,0,0,0,'owner')").run();const claims=await Promise.all([deps.admitBetaAccount('race-a','race@example.test'),deps.admitBetaAccount('race-b','race@example.test')]);assert.equal(claims.filter(Boolean).length,1);
console.log('PASS: real SQLite beta admission on private reads/writes/photos/backups/export/health/entitlements, invited Free, owner UUID preservation, verified-email binding, email reuse rejection, revocation/reactivation, Pro independence, old-client safety and concurrent claims.');
