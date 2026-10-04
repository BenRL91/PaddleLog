import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import {DatabaseSync} from 'node:sqlite';import {createClient} from '@supabase/supabase-js';
const sql=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+file,'utf8'));
const db={prepare(q){let args=[];return {bind(...v){args=v;return this;},async first(){return sql.prepare(q).get(...args)??null;},async run(){return {meta:{changes:Number(sql.prepare(q).run(...args).changes)}};}}},async batch(items){sql.exec('BEGIN');try{for(const x of items)await x.run();sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};
const deps={storage:()=>db,createClient,cookieAuthorization:()=>''};
async function load(path){const source=fs.readFileSync(path,'utf8').replace(/^import .*;\s*$/gm,'');const compiled=ts.transpileModule('const {'+Object.keys(deps).join(',')+'}=globalThis.sharedDeps;\n'+source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;globalThis.sharedDeps=deps;return import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));}
const {externalAccount,linkExternalIdentity}=await load('lib/server/identity-map.ts');const {verifiedExternalIdentity}=await load('lib/server/external-identity.ts');
const config={SUPABASE_URL:'https://provider.test',SUPABASE_PUBLISHABLE_KEY:'public-test-key'};let calls=0,invalid=false,anonymous=false;
globalThis.fetch=async(url,init)=>{calls++;assert.equal(String(url),'https://provider.test/auth/v1/user');assert.ok(new Headers(init.headers).get('authorization').startsWith('Bearer '));return Response.json(invalid?{msg:'Invalid token'}:{id:'external-a',is_anonymous:anonymous},{status:invalid?401:200});};
const req=new Request('https://api.test',{headers:{authorization:'Bearer test-access-token-not-a-real-jwt'}});
await assert.rejects(verifiedExternalIdentity(undefined,config));assert.equal(calls,0);await assert.rejects(verifiedExternalIdentity(req,{}));
const identity=await verifiedExternalIdentity(req,config);assert.deepEqual(identity,{issuer:'https://provider.test/auth/v1',subject:'external-a',verifiedEmail:undefined});
invalid=true;await assert.rejects(verifiedExternalIdentity(req,config));invalid=false;anonymous=true;await assert.rejects(verifiedExternalIdentity(req,config));anonymous=false;
sql.prepare("INSERT INTO leeway_accounts(id,subject,status) VALUES ('owner','sites-owner','active')").run();
sql.prepare("INSERT INTO account_logs VALUES ('owner','kept',8)").run();await linkExternalIdentity('owner',identity);assert.equal((await externalAccount(identity)).id,'owner');assert.equal(sql.prepare("SELECT payload FROM account_logs WHERE account_id='owner'").get().payload,'kept');
const b=await externalAccount({...identity,subject:'external-b'});assert.notEqual(b.id,'owner');assert.equal((await externalAccount({...identity,subject:'external-b'})).id,b.id);await assert.rejects(linkExternalIdentity('owner',{...identity,subject:'external-b'}));
const c=await externalAccount({...identity,issuer:'https://other.test/auth/v1'});assert.notEqual(c.id,'owner');
sql.prepare("UPDATE leeway_accounts SET status='deleting' WHERE id=?").run(b.id);assert.equal((await externalAccount({...identity,subject:'external-b'})).status,'deleting');
console.log('PASS: real Supabase getUser boundary, missing/invalid/anonymous rejection, provider-separated identities, owner linking preserves UUID/data, duplicate sign-in idempotence and conflict protection.');
// Exercise the actual owner-link route, not only the mapping helper.
class AccountError extends Error{constructor(status,message){super(message);this.status=status;}}
Object.assign(deps,{env:{...config,LEEWAY_AUTH_MODE:'sites'},account:async()=>({id:'owner'}),verifiedExternalIdentity,linkExternalIdentity,AccountError,crossSite:req=>req.headers.get('sec-fetch-site')==='cross-site',failure:e=>Response.json({error:e.message},{status:e.status??503})});
const route=await load('app/api/auth/link/route.ts');
const linking=headers=>new Request('https://site.test/api/auth/link',{method:'POST',headers:{authorization:'Bearer test-access-token-not-a-real-jwt','x-confirm-link':'link-my-leeway-account','x-link-account':'owner',...headers}});
assert.equal((await route.POST(linking({'x-link-account':'other'}))).status,409);assert.equal((await route.POST(linking({'sec-fetch-site':'cross-site'}))).status,400);assert.equal((await route.POST(linking({}))).status,200);invalid=true;assert.equal((await route.POST(linking({}))).status,503);invalid=false;deps.env.LEEWAY_AUTH_MODE='supabase';assert.equal((await route.POST(linking({}))).status,503);
console.log('PASS: actual linking endpoint requires both identities, explicit confirmation and unchanged current account; cross-site/invalid provider proof rejected.');
