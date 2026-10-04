import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stageApprovalRefresh} from '../scripts/refresh-approval-snapshot.mjs';
import {modelApproval,modelKey,approvalSnapshotHealth} from '../public/competition.js';
const data=JSON.parse(fs.readFileSync('public/competition-data.json'));
const candidate=JSON.parse(fs.readFileSync('data/official-approval-lists-2026-10-02.json'));
const now=Date.parse('2026-10-02T18:00:00Z');
const original=JSON.stringify(data),stable=stageApprovalRefresh(data,candidate,now);
assert.equal(stable.changes.added.length,0);assert.equal(stable.changes.removed.length,0);assert.equal(stable.changes.changed.length,0);assert.equal(JSON.stringify(data),original);
const missing=structuredClone(candidate),removed=missing.records.find(a=>a.organization==='USAP');missing.records=missing.records.filter(a=>a.id!==removed.id);missing.lists.find(x=>x.organization==='USAP').count--;
const staged=stageApprovalRefresh(data,missing,now);assert.equal(staged.changes.removed.length,1);
const p={brand:removed.brand,model:removed.model,shape:'',thickness:removed.thicknessMm??''};p.configuration={approvalReferences:{USAP:{id:removed.id,modelKey:modelKey(p)}}};
assert.equal(modelApproval(p,data.rulesets.find(r=>r.id==='usap'),data,now).status,'APPROVED');
assert.equal(modelApproval(p,staged.updated.rulesets.find(r=>r.id==='usap'),staged.updated,now).status,'NOT_VERIFIED');
assert.equal(staged.updated.approvals.find(x=>x.id===removed.id).status,'needsVerification');
assert.deepEqual(staged.updated.configurationApprovals,data.configurationApprovals);assert.deepEqual(staged.updated.rulesets,data.rulesets);
const changed=structuredClone(candidate);changed.records[0].status='delisted';assert.equal(stageApprovalRefresh(data,changed,now).changes.changed.length,1);
const added=structuredClone(candidate);added.records.push({...added.records[0],id:'usap-new-fixture'});added.lists.find(x=>x.organization==='USAP').count++;assert.equal(stageApprovalRefresh(data,added,now).changes.added.length,1);
for(const mutation of [x=>x.records.push(x.records[0]),x=>x.records.pop(),x=>x.lists[0].complete=false,x=>x.records[0].sourceUrl='https://evil.test/list',x=>x.records[0].verificationState='importedClaim',x=>x.retrievedAt='2099-01-01',x=>x.retrievedAt='2026-02-30',x=>x.retrievedAt='2026-01-01']){const invalid=structuredClone(candidate);mutation(invalid);assert.throws(()=>stageApprovalRefresh(data,invalid,now));}
assert.equal(approvalSnapshotHealth(data,now).fresh,true);assert.equal(approvalSnapshotHealth(data,now+31*86400000).fresh,false);
assert.equal(modelApproval(p,data.rulesets.find(r=>r.id==='usap'),data,now+31*86400000).status,'NOT_VERIFIED');
// Records readable in the owner's current library: no mutation of the live library.
const us=data.rulesets.find(r=>r.id==='usap');
assert.equal(modelApproval({brand:'GoSports',model:'Wooden'},us,data,now).status,'NOT_VERIFIED');
const head={brand:'Head',model:'Radical Elite',shape:'',thickness:''};assert.equal(modelApproval(head,us,data,now).status,'NOT_VERIFIED');assert.match(modelApproval(head,us,data,now).message,/2 official listing/);
const exact=data.approvals.find(x=>x.organization==='USAP'&&x.brand==='Head'&&x.model==='Radical Elite');head.configuration={approvalReferences:{USAP:{id:exact.id,modelKey:modelKey(head)}}};assert.equal(modelApproval(head,us,data,now).status,'APPROVED');
console.log('PASS: unchanged snapshot, additions, changed statuses, removed-listing downgrade, duplicate/incomplete/untrusted/date rejection, stale badges, and readable owner-library model diagnostics.');
