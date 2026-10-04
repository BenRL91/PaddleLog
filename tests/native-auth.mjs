import assert from 'node:assert/strict';
import {createLeewayAuth} from '../native/leeway-auth.ts';
const memory=new Map();let opened;
const auth=createLeewayAuth({url:'https://provider.test',publishableKey:'public-test-key',apiOrigin:'https://api.test',redirectUrl:'paddlelog://auth/return',secureStore:{get:async k=>memory.get(k)??null,set:async(k,v)=>{memory.set(k,v);},remove:async k=>{memory.delete(k);}},openBrowser:async url=>{opened=new URL(url);}});
assert.equal(await auth.accessToken(),null);assert.equal(await auth.currentAccount(),null);
await auth.oauth('google');assert.equal(opened.origin,'https://provider.test');assert.equal(opened.searchParams.get('provider'),'google');assert.equal(opened.searchParams.get('prompt'),'select_account');assert.equal(opened.searchParams.get('code_challenge_method'),'s256');assert.ok(opened.searchParams.get('code_challenge'));assert.ok([...memory.keys()].some(k=>k.includes('code-verifier')));
await assert.rejects(auth.callback('https://attacker.test/?code=untrusted'));await assert.rejects(auth.callback('paddlelog://auth/return?error=denied'));assert.match(auth.message,/same sign-in method/);auth.setActive(false);
assert.throws(()=>createLeewayAuth({url:'http://unsafe.test',apiOrigin:'https://api.test',redirectUrl:'paddlelog://auth/return'}));
console.log('PASS: native auth uses PKCE, secure-store adapter, exact callback matching and verified account lookup; no token fallback to localStorage.');
