import assert from 'node:assert/strict';
import {usageSegments,usesPaddle,paddleDurations,normalizeSegments,switchTimerPaddle,finishTimer,withoutPaddle} from '../public/session-segments.js';
import {validate} from '../public/validate.js';
import {sessionUsage,componentWear,estimateContribution} from '../public/maintenance.js';
import {lifecycle,usageSplit} from '../public/analytics.js';
import {buildChanges,applyChanges} from '../public/record-sync.js';
const at=h=>new Date(Date.UTC(2026,9,4,h)).toISOString();
const paddles=['p1','p2'].map(id=>({id,brand:'Example',model:id,maintenance:['overgrip','edgeTape','skin'].map(kind=>({id:kind,kind,action:'install',at:at(9),interval:1}))}));
const legacy={id:'legacy',paddleId:'p1',start:at(10),end:at(11)};
let timer={id:'s1',accountId:'owner',paddleId:'p1',start:at(10)};
timer=switchTimerPaddle(timer,'p2',at(11),'seg2');timer=JSON.parse(JSON.stringify(timer));timer=switchTimerPaddle(timer,'p1',at(12),'seg3');
const finished=finishTimer(timer,at(13));
assert.deepEqual(paddleDurations(finished),[{paddleId:'p1',hours:2},{paddleId:'p2',hours:1}]);
assert.equal(usesPaddle(finished,'p2'),true);assert.equal(sessionUsage('p1',[finished]),2);assert.equal(sessionUsage('p2',[finished]),1);
assert.equal(sessionUsage('p1',[finished],Date.parse(at(11))),1);
assert.equal(sessionUsage('p2',[finished],Date.parse(at(11)),Date.parse(at(12))),1);
for(const kind of ['overgrip','edgeTape','skin']){assert.equal(componentWear(paddles[0],[finished],kind).hours,2);assert.equal(componentWear(paddles[1],[finished],kind).hours,1);}
const base=validate({version:2,paddles,sessions:[legacy],usagePeriods:[]});
const saved=validate({...base,sessions:[legacy,finished]});assert.deepEqual(saved.sessions[1].segments,finished.segments);
assert.equal(lifecycle(paddles[1],saved.sessions).sessionCount,1);assert.equal(usageSplit('p2',saved.sessions).logged,1);
assert.deepEqual(validate(JSON.parse(JSON.stringify(saved))),saved);
assert.deepEqual(validate(applyChanges(base,buildChanges(base,saved))),saved);
const edited=structuredClone(finished);edited.segments[0].end=at(10.5); // use explicit minutes below
edited.segments[0].end='2026-10-04T10:30:00.000Z';assert.equal(sessionUsage('p1',[edited]),1.5);assert.equal(componentWear(paddles[0],[edited],'overgrip').level,1);
assert.equal(sessionUsage('p1',[]),0);assert.equal(sessionUsage('p1',[legacy]),1);
const estimate={id:'e',paddleId:'p2',start:at(10),end:at(13),estimatedHours:3};assert.equal(estimateContribution(estimate,[finished,estimate]),2);assert.equal(sessionUsage('p2',[finished,estimate]),3);
const ids=new Set(['p1','p2']);assert.deepEqual(normalizeSegments(finished,ids),finished.segments);
for(const mutate of [s=>s.segments[1].start=at(10),s=>s.segments[0].end=at(14),s=>s.segments[0].paddleId='other-user',s=>s.segments[1].id=s.segments[0].id,s=>s.segments=[],s=>s.estimatedHours=2]){const bad=structuredClone(finished);mutate(bad);assert.throws(()=>normalizeSegments(bad,ids));}
assert.throws(()=>switchTimerPaddle(timer,'p2',at(11),'bad'));
assert.throws(()=>switchTimerPaddle(finished,'p2',at(14),'bad'));
assert.deepEqual(finishTimer(finished,at(14)),finished); // retry does not add time
const immediate=switchTimerPaddle({id:'t',paddleId:'p1',start:at(10)},'p2',at(10),'now');assert.equal(immediate.segments.length,1);assert.equal(finishTimer(immediate,at(11)).paddleId,'p2');
const deleted=withoutPaddle(finished,'p1');assert.equal(deleted.paddleId,'p2');assert.equal(sessionUsage('p2',[deleted]),1);assert.equal(withoutPaddle(deleted,'p2'),null);
assert.equal(withoutPaddle(legacy,'p1'),null);
console.log('PASS: legacy compatibility, switch/back/reload, isolated wear, historical corrections/deletion, estimate replacement, validation, backup/sync roundtrip, deletion preserving other paddles, idempotent timer end.');
