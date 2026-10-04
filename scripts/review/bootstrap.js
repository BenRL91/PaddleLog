// The isolated HTTP preview lacks secure-context randomUUID; production uses HTTPS.
if(!crypto.randomUUID)crypto.randomUUID=()=> '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(Number(c)^crypto.getRandomValues(new Uint8Array(1))[0]&15>>Number(c)/4).toString(16));
import {validate} from '/validate.js';
import {applyChanges} from '/record-sync.js';
import {normalizeSharedCatalog} from '/shared-catalog.js';
const originalFetch=window.fetch.bind(window);
const catalog=await originalFetch('/reference-catalog.json').then(r=>r.json());
const rules=await originalFetch('/competition-data.json').then(r=>r.json());
const rows=normalizeSharedCatalog(catalog),chosen=rows.filter(r=>r.reference).slice(0,3);
const query=new URLSearchParams(location.search),empty=query.has('empty'),pro=query.get('tier')!=='free';
let state=validate({version:2,paddles:empty?[]:chosen.map((r,i)=>({id:'review_p'+i,brand:r.brand,model:r.model,shape:r.shape||'',modelId:r.referenceModelId,thickness:r.reference?.thickness??16,nickname:i===0?'Match paddle':'',staticWeight:i===0?8.34:'',swingWeight:i===0?118:'',twistWeight:i===0?6.7:'',balancePoint:i===0?24.4:'',favorite:i===0,createdAt:'2026-09-01T12:00:00Z',overgripInstalledAt:'2026-09-20T12:00:00Z',configuration:{modifications:[],setupTop:'2 g tungsten',setupSides:'3 g each side',undergrip:'Hesacore'},notes:'Illustrative review data. Not a real user record.'})),sessions:empty?[]:Array.from({length:8},(_,i)=>({id:'review_s'+i,paddleId:'review_p'+i%3,start:`2026-09-${21+i}T17:00:00Z`,end:`2026-09-${21+i}T19:00:00Z`,ball:'Franklin X-40',environment:'outdoor',location:'Sample courts',notes:'Review session'})),usagePeriods:[],settings:empty?{}:{mainPaddleId:'review_p0'}}),revision=0;
const response=(data,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}));
window.fetch=(input,options={})=>{const u=new URL(typeof input==='string'?input:input.url,location.href);if(u.origin!==location.origin)return response({error:'External requests disabled in review'},403);if(!u.pathname.startsWith('/api/'))return originalFetch(input,options);
 if(u.pathname==='/api/state'){if(['PATCH','PUT'].includes(options.method)){const body=JSON.parse(options.body);state=validate(body.changes?applyChanges(state,body.changes):body.state);revision++;}return response({state,revision,accountId:'isolated-review'});}
 if(u.pathname==='/api/competition')return response(rules);
 if(u.pathname==='/api/entitlements')return response({accountId:'isolated-review',grants:pro?[{key:'paddlelife_pro',startsAt:0,endsAt:null}]:[],pro,purchasesEnabled:false});
 if(u.pathname==='/api/auth/methods')return response({accountId:'isolated-review',email:'review@example.invalid'});
 if(u.pathname==='/api/library-health')return response({paddles:state.paddles.length,sessions:state.sessions.length,maintenance:0,lifetimeHours:state.sessions.length*2,revision,storage:'records'});
 if(u.pathname==='/api/backups')return response({copies:[]});
 return response({error:'Unavailable in isolated UI review'},403);
};
const label=document.createElement('div');label.textContent='UI REVIEW · SAMPLE DATA · '+(pro?'PRO':'FREE');label.style.cssText='position:fixed;top:0;right:0;z-index:99999;background:#153d46;color:white;font:10px sans-serif;padding:3px;pointer-events:none';document.body.append(label);

await import('/app.js');await import('/support.js');
