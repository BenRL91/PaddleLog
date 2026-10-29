import assert from 'node:assert/strict';import {resumeExistingSession} from '../web/login-session.js';
let calls=0;const options={mode:'supabase',hasCallback:false,fetcher:async(url,init)=>{calls++;assert.equal(url,'/api/auth/session');assert.equal(JSON.parse(init.body).action,'refresh');return Response.json({mode:'supabase',accountId:'existing'});}};
assert.equal(await resumeExistingSession(options),true);assert.equal(calls,1);
assert.equal(await resumeExistingSession({...options,hasCallback:true}),false);assert.equal(calls,1);
assert.equal(await resumeExistingSession({...options,mode:'sites'}),false);assert.equal(calls,1);
for(const status of [401,403,503])assert.equal(await resumeExistingSession({...options,fetcher:async()=>Response.json({error:'Sign in again'},{status})}),false);
assert.equal(await resumeExistingSession({...options,fetcher:async()=>Response.json({mode:'supabase'})}),false);
console.log('PASS: authenticated login resumes app, callbacks are not intercepted, signed-out/expired sessions can sign in, legacy linking stays intact.');
