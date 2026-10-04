import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateCompetition,modelApproval,modelKey} from '../public/competition.js';
const data=JSON.parse(fs.readFileSync('public/competition-data.json'));
const now=Date.parse('2026-10-02T17:00:00Z');const us=data.rulesets.find(r=>r.id==='usap'),up=data.rulesets.find(r=>r.id==='ppa-pro');
const paddle={id:'test',brand:'Test',model:'Test',length:16,width:8,staticWeight:10,thickness:16,maintenance:[],configuration:{modifications:[]}};
const check=(p,r)=>evaluateCompetition(p,r,data,now);
assert.ok(!check(paddle,up).violations.some(i=>i.code==='WEIGHT_LIMIT_EXCEEDED'));
assert.ok(check({...paddle,staticWeight:10.01},up).violations.some(i=>i.code==='WEIGHT_LIMIT_EXCEEDED'));
assert.ok(!check({...paddle,staticWeight:12},us).violations.some(i=>i.code==='WEIGHT_LIMIT_EXCEEDED'));
assert.ok(check({...paddle,length:17.1},up).violations.some(i=>i.code==='PADDLE_TOO_LONG'));
assert.ok(check({...paddle,width:8.1},us).violations.some(i=>i.code==='COMBINED_DIMENSIONS_EXCEEDED'));
assert.ok(check({...paddle,thickness:6},up).violations.some(i=>i.code==='THICKNESS_NONCOMPLIANT'));
assert.ok(check({...paddle,thickness:24},up).issues.some(i=>i.code==='RULES_NEED_VERIFICATION'));
const skin={id:'s',kind:'skin',action:'install',at:'2026-10-01',manufacturer:'Reload',product:'RLD-1 sheets',variant:'RLD-1'};
assert.ok(check({...paddle,maintenance:[skin]},up).violations.some(i=>i.code==='AFTERMARKET_SURFACE_NOT_ALLOWED'));
assert.ok(!check({...paddle,maintenance:[skin]},us).violations.length);
const item={id:'w',label:'Slider',zone:'sides',type:'slider',grams:10,positionCm:20,lateralCm:5};
assert.ok(check({...paddle,configuration:{modifications:[],weights:{base:{},items:[item]}}},up).violations.some(i=>i.code==='UNAPPROVED_WEIGHT_MODIFICATION'));
assert.ok(!check({...paddle,configuration:{modifications:[],weights:{base:{},items:[item]}}},us).violations.length);
const weighted={...paddle,configuration:{modifications:[],weights:{base:{grams:280},items:[{...item,type:'tape'}]}}};
assert.ok(check(weighted,up).violations.some(i=>i.code==='WEIGHT_LIMIT_EXCEEDED'));
// Explicit official reference is scoped to the original physical model identity.
const rec=data.approvals.find(a=>a.id&&a.organization==='USAP');
assert.ok(rec,'Complete official list has been integrated');
const p={...paddle,brand:rec.brand,model:rec.model,configuration:{modifications:[],approvalReferences:{USAP:{id:rec.id,modelKey:modelKey({...paddle,brand:rec.brand,model:rec.model})}}}};
assert.equal(modelApproval(p,us,data,now).status,'APPROVED');
assert.equal(modelApproval({...p,model:'Different paddle'},us,data,now).status,'NOT_VERIFIED');
assert.equal(modelApproval(p,us,data,now+31*86400000).status,'NOT_VERIFIED');
for(const id of ['usap-7270','usap-11044']){
 const base=data.approvals.find(a=>a.id===id),unit={...paddle,brand:base.brand,model:base.model,maintenance:[skin]};unit.configuration.approvalReferences={USAP:{id,modelKey:modelKey(unit)}};
 assert.ok(check(unit,us).issues.some(i=>i.code==='SKIN_CONFIGURATION_APPROVED'));
 assert.ok(!check({...unit,maintenance:[{...skin,variant:'Other'}]},us).issues.some(i=>i.code==='SKIN_CONFIGURATION_APPROVED'));
}
assert.equal(data.officialLists.find(x=>x.organization==='USAP').count,5367);
assert.equal(new Set(data.approvals.filter(a=>a.organization==='USAP').map(a=>a.id)).size,5367);
assert.equal(data.officialLists.find(x=>x.organization==='UPA-A').count,274);
console.log('PASS: complete list counts, scoped official-model selection, stale snapshots, USAP/UPA weight differences, thickness boundaries, perimeter sliders, total configured mass, and exact OEM replacement surfaces.');

// Amateur setup coverage is useful without silently importing professional-only prohibitions.
const amateur=data.rulesets.find(r=>r.id==='upa-amateur');
assert.equal(amateur.coverage,'recordedConfiguration');
assert.equal(modelApproval(p,amateur,data,now).status,'APPROVED');
const ordinary=check(p,amateur);
assert.equal(ordinary.status,'CONDITIONAL');
assert.ok(!ordinary.issues.some(i=>i.code==='RULES_NEED_VERIFICATION'));
assert.ok(ordinary.issues.some(i=>i.code==='EVENT_TESTING_REQUIRED'));
assert.ok(check({...p,length:17.1},amateur).violations.some(i=>i.code==='PADDLE_TOO_LONG'));
assert.ok(check({...p,width:8.1},amateur).violations.some(i=>i.code==='COMBINED_DIMENSIONS_EXCEEDED'));
for(const unit of [{...p,staticWeight:10.01},{...p,thickness:25},{...p,maintenance:[skin]},{...p,configuration:{...p.configuration,weights:{base:{},items:[item]}}}]){
 const result=check(unit,amateur);
 assert.equal(result.violations.length,0);
 assert.ok(result.issues.some(i=>i.code==='RULES_NEED_VERIFICATION'&&i.candidateCode));
 assert.equal(result.status,'NEEDS_VERIFICATION');
}
assert.ok(check({...p,staticWeight:10.01,length:17.1},amateur).violations.some(i=>i.code==='PADDLE_TOO_LONG'));
assert.equal(check(p,{...amateur,lastVerified:'2026-01-01'}).status,'NEEDS_VERIFICATION');
console.log('PASS: amateur alternative approval, shared dimensions, inspection, stale rules, and scoped weight/thickness/skin/slider checks without false amateur prohibitions.');
