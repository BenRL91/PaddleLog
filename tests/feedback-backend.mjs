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


Object.assign(deps,await module('lib/server/feedback.ts'));
const feedback=await module('app/api/feedback/route.ts'),inbox=await module('app/api/admin/feedback/route.ts');
user={userId:'tester-a',email:'a@example.test'};
const req=(path,method='GET',body)=>new Request('https://test'+path,{method,headers:{origin:'https://test','x-leeway-session':'1'},...(body?{body:JSON.stringify(body)}:{})});
const input={id:'report-1',kind:'Catalog correction',message:'Wrong shape',screen:'Paddles',steps:'',version:'test',context:{brand:'Brand',shape:'Hybrid'}};
assert.equal((await feedback.POST(req('/api/feedback','POST',input))).status,200);
assert.equal((await feedback.POST(req('/api/feedback','POST',input))).status,200);
assert.equal(sql.prepare('SELECT count(*) n FROM feedback_reports').get().n,1);
assert.equal((await feedback.POST(req('/api/feedback','POST',{...input,message:'changed'}))).status,409);
assert.equal((await feedback.POST(req('/api/feedback','POST',{...input,id:'invalid',context:{accountId:'private'}}))).status,400);
assert.equal((await feedback.POST(new Request('https://test/api/feedback',{method:'POST',headers:{origin:'https://evil','sec-fetch-site':'cross-site'},body:JSON.stringify(input)}))).status,403);
assert.equal((await inbox.GET(req('/api/admin/feedback'))).status,403);
user={userId:'tester-b',email:'b@example.test'};assert.equal((await feedback.POST(req('/api/feedback','POST',input))).status,409);assert.equal((await (await feedback.GET(req('/api/feedback'))).json()).reports.length,0);
sql.prepare("INSERT INTO leeway_accounts(id,subject,status) VALUES (?, 'owner-existing','active')").run(deps.OWNER_ACCOUNT_ID);user={userId:'owner-existing',email:'owner@example.test'};const page=await (await inbox.GET(req('/api/admin/feedback'))).json();assert.equal(page.reports.length,1);
const update={id:'report-1',revision:0,status:'fixed',resolution:'Corrected shape',fixedVersion:''};
assert.equal((await inbox.POST(req('/api/admin/feedback','POST',update))).status,400);
update.fixedVersion='v147';assert.equal((await inbox.POST(req('/api/admin/feedback','POST',update))).status,200);assert.equal((await inbox.POST(req('/api/admin/feedback','POST',update))).status,409);
user={userId:'tester-a',email:'a@example.test'};const mine=await (await feedback.GET(req('/api/feedback'))).json();assert.equal(mine.reports[0].fixedVersion,'v147');assert.equal(mine.reports[0].resolution,'Corrected shape');assert.equal(mine.reports[0].accountId,undefined);
// Reporter deletion removes their feedback and cannot affect another tester.
await feedback.POST(req('/api/feedback','POST',{...input,id:'a-second'}));user={userId:'tester-b',email:'b@example.test'};await feedback.POST(req('/api/feedback','POST',{...input,id:'b-only'}));user={userId:'tester-a',email:'a@example.test'};
const del=await accounts.DELETE(new Request('https://test/api/account',{method:'DELETE',headers:{origin:'https://test','x-confirm-delete':'delete-my-account'}}));assert.equal(del.status,200);assert.equal(sql.prepare('SELECT count(*) n FROM feedback_reports').get().n,1);assert.equal(sql.prepare('SELECT id FROM feedback_reports').get().id,'b-only');
env.LEEWAY_AUTH_MODE='supabase';identity={issuer:'https://auth.test/auth/v1',subject:'uninvited'};
const privateReq=new Request('https://test/api/feedback',{headers:{authorization:'Bearer verified'}});assert.equal((await feedback.GET(privateReq)).status,403);
console.log('PASS: SQLite report persistence, idempotent retries, payload conflicts, context limits, cross-site rejection, private reporter lists, owner authorization, fixed-version validation, stale-revision protection, reporter updates, scoped deletion and beta admission.');
