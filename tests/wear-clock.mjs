import assert from 'node:assert/strict';
import {componentWear,wearSessionBreakdown} from '../public/maintenance.js';
const date=h=>new Date(Date.UTC(2026,8,30,h)).toISOString();
const paddle={id:'p',maintenance:['overgrip','edgeTape','skin'].map(kind=>({id:kind,kind,action:'install',at:date(8),interval:4}))};
const session=(id,a,b)=>({id,paddleId:'p',start:date(a),end:date(b)});
const sessions=[session('before',5,7),session('crosses',7,10),session('after',10,13)];
const original=Date.now;
try{
 for(const clock of [0,Date.parse(date(8)),Date.parse(date(9)),Date.parse(date(18)),Date.parse(date(24))+365*86400000]){
  Date.now=()=>clock;
  for(const kind of ['overgrip','edgeTape','skin']){
   const wear=componentWear(paddle,sessions,kind);
   assert.equal(wear.hours,5);assert.equal(wear.label,'New');
   assert.equal(wearSessionBreakdown(paddle,sessions,kind).reduce((s,r)=>s+r.countedHours,0),5);
  }
 }
 Date.now=()=>Date.parse(date(9));
 for(const kind of ['overgrip','edgeTape','skin']){
  assert.equal(componentWear(paddle,[session('after',10,15)],kind).hours,5);
  assert.equal(componentWear(paddle,[session('after',10,11)],kind).hours,1);
  assert.equal(componentWear(paddle,[],kind).hours,0);
 }
}finally{Date.now=original;}
console.log('PASS: all wear clocks are independent of real time; full saved durations, installation overlap, edits and deletion match the session breakdown.');
