import assert from 'node:assert/strict';
import {componentWear,sessionUsage,maintenanceEvents} from '../public/maintenance.js';
import {validate} from '../public/validate.js';
import {mergeChanges} from '../public/sync.js';
const t=Date.parse('2026-09-01T00:00:00Z'),hour=3600000,date=h=>new Date(t+h*hour).toISOString(),now=t+100*hour;
let p={id:'p',brand:'A',model:'B',maintenance:['overgrip','edgeTape','skin'].map((kind,i)=>({id:'i'+i,kind,action:'install',at:date(0),interval:4,product:kind}))},sessions=[];
const wears=()=>['overgrip','edgeTape','skin'].map(k=>componentWear(p,sessions,k,{},now));
assert.deepEqual(wears().map(x=>x.hours),[0,0,0]);
sessions=[{id:'a',paddleId:'p',start:date(1),end:date(3)},{id:'b',paddleId:'p',start:date(4),end:date(7)}];assert.deepEqual(wears().map(x=>x.hours),[5,5,5]);assert.ok(wears().every(x=>x.label==='New'));
sessions[0].end=date(2);assert.deepEqual(wears().map(x=>x.hours),[4,4,4]);sessions.pop();assert.ok(wears().every(x=>x.hours===1&&x.label==='Brand New'));
sessions[0].end=date(10);assert.ok(wears().every(x=>x.hours===9&&x.label==='Used'));
for(const [kind,i] of [['overgrip',0],['edgeTape',1],['skin',2]]){p.maintenance.push({id:'r'+i,kind,action:'install',at:date(20),interval:4});const hours=wears().map(x=>x.hours);for(let j=0;j<3;j++)assert.equal(hours[j],j<=i?0:9);assert.equal(sessionUsage('p',sessions,0,now),9);}
assert.equal(p.maintenance.length,6);sessions=[];assert.ok(wears().every(x=>x.hours===0));
sessions=[{id:'partial',paddleId:'p',start:date(19),end:date(23)},{id:'other',paddleId:'other',start:date(0),end:date(20)}];assert.ok(wears().every(x=>x.hours===3));
assert.equal(componentWear(p,[...sessions,{paddleId:'p',start:'bad',end:'bad'}],'skin',{},now).hours,3);
const snapshot=validate({version:2,paddles:[p],sessions:sessions.slice(0,1),usagePeriods:[],settings:{overgripHoursPerLevel:6,edgeTapeHoursPerLevel:12}});assert.deepEqual(validate(JSON.parse(JSON.stringify(snapshot))),snapshot);assert.equal(snapshot.settings.overgripHoursPerLevel,6);
const legacy=validate({...snapshot,settings:{...snapshot.settings,mainPaddleId:null,mainPaddleHistory:[]},paddles:[{id:'legacy',brand:'A',model:'B',overgripInstalledAt:date(0)}],sessions:[]});assert.equal(legacy.paddles[0].maintenance[0].at,date(0));assert.equal(maintenanceEvents(legacy.paddles[0]).length,1);
const desired=structuredClone(snapshot),remote=structuredClone(snapshot);desired.paddles[0].maintenance.push({id:'local',kind:'skin',action:'remove',at:date(25)});remote.paddles[0].notes='Another device';assert.equal(mergeChanges(snapshot,desired,remote).paddles[0].maintenance.length,7);
remote.paddles[0].maintenance.push({id:'remote',kind:'skin',action:'install',at:date(26)});assert.throws(()=>mergeChanges(snapshot,desired,remote),/same field/);
p.maintenance.push({id:'removed',kind:'skin',action:'remove',at:date(30)});assert.equal(componentWear(p,sessions,'skin',{},now).installed,false);assert.equal(componentWear(p,sessions,'edgeTape',{},now).hours,3);
console.log('PASS: all components recalculate forward/backward from sessions; replacements/removal isolated; lifetime intact; partial sessions, migration, reload, settings and sync conflicts.');

assert.throws(()=>validate({...snapshot,paddles:[{...p,maintenance:'invalid'}]}),/must be a list/);
