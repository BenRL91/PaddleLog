import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import {createClient} from '@supabase/supabase-js';
let admitted=true;const deps={admitBetaAccount:async()=>admitted,betaAdmissionMessage:"Invite required",createClient,linkHeader:()=> '__Host-leeway-link=; Path=/; Max-Age=0'};async function load(path){const code=fs.readFileSync(path,'utf8').replace(/^import .*;\s*$/gm,'');globalThis.sessionDeps=deps;return import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule('const {'+Object.keys(deps).join(',')+'}=globalThis.sessionDeps;\n'+code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));}
const helper=await load('lib/server/web-session.ts');Object.assign(deps,helper);
assert.equal(helper.cookieAuthorization(new Request('https://app.test',{headers:{cookie:'unrelated=x; __Host-leeway-access=abc'}})),'Bearer abc');
assert.equal(helper.cookieAuthorization(undefined),'');
for(const h of helper.sessionHeaders({access_token:'a',refresh_token:'r',expires_in:3600}).getSetCookie()){assert.match(h,/HttpOnly; Secure; SameSite=Lax/);assert.match(h,/Path=\//);}
assert.ok(helper.sessionHeaders().getSetCookie().every(h=>h.includes('Max-Age=0')));
const cfg={SUPABASE_URL:'https://provider.test',SUPABASE_PUBLISHABLE_KEY:'public-test'};
let offline=false,anonymous=false;
globalThis.fetch=async(url,init)=>{if(offline)throw new TypeError('offline');assert.match(String(url),/token\?grant_type=refresh_token/);assert.equal(JSON.parse(init.body).refresh_token,'valid-refresh');return Response.json({access_token:'verified-access',refresh_token:'rotated-refresh',token_type:'bearer',expires_in:3600,user:{id:'user-a',is_anonymous:anonymous}});};
const result=await helper.refreshWebSession('valid-refresh',cfg);assert.equal(result.identity.subject,'user-a');assert.equal(result.session.refresh_token,'rotated-refresh');
anonymous=true;await assert.rejects(helper.refreshWebSession('valid-refresh',cfg));anonymous=false;
await assert.rejects(helper.refreshWebSession('',cfg));
Object.assign(deps,{env:{...cfg,LEEWAY_AUTH_MODE:'supabase'},externalAccount:async identity=>({id:identity.subject==='user-a'?'existing-library':'another-library',status:'active'})});
const route=await load('app/api/auth/session/route.ts');
const req=(body,headers={})=>new Request('https://app.test/api/auth/session',{method:'POST',headers:{origin:'https://app.test','x-leeway-session':'1',...headers},body:JSON.stringify(body)});
assert.equal((await route.POST(req({action:'signin',refreshToken:'valid-refresh'},{origin:'https://evil.test'}))).status,403);
assert.equal((await route.POST(req({action:'refresh'}))).status,401);
let r=await route.POST(req({action:'signin',refreshToken:'valid-refresh'}));assert.equal(r.status,200);assert.equal((await r.json()).accountId,'existing-library');assert.equal(r.headers.getSetCookie().length,2);
r=await route.POST(req({action:'refresh'},{cookie:'__Host-leeway-refresh=valid-refresh'}));assert.equal(r.status,200);
admitted=false;r=await route.POST(req({action:'refresh'},{cookie:'__Host-leeway-refresh=valid-refresh'}));assert.equal(r.status,403);assert.equal((await r.json()).code,'BETA_INVITE_REQUIRED');assert.ok(r.headers.getSetCookie().every(h=>h.includes('Max-Age=0')));admitted=true;
r=await route.POST(req({action:'signout'}));assert.equal(r.status,200);assert.ok(r.headers.getSetCookie().every(h=>h.includes('Max-Age=0')));
assert.equal((await route.POST(req({action:'unknown'}))).status,400);
// Simulated provider outage must not delete session cookies or touch paddle records.
deps.refreshWebSession=async()=>{throw Error('offline');};
// Dependencies are captured on module load; load a distinct copy for failure injection.
const failCode=fs.readFileSync('app/api/auth/session/route.ts','utf8').replace(/^import .*;\s*$/gm,'');globalThis.sessionDeps=deps;const failed=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule('const {'+Object.keys(deps).join(',')+'}=globalThis.sessionDeps;\n'+failCode+'\n// failure fixture',{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
r=await failed.POST(req({action:'refresh'},{cookie:'__Host-leeway-refresh=valid-refresh'}));assert.equal(r.status,503);assert.equal(r.headers.get('set-cookie'),null);
console.log('PASS: real SDK refresh, persistent HttpOnly cookies, cookie parsing, provider verification, anonymous rejection, CSRF, existing-library mapping, rotation, restart refresh, signout, malformed action, offline cookie preservation.');
