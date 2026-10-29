import {usageSegments,usesPaddle} from './session-segments.js';
export const wearLevels=Object.freeze([{label:'Brand New',color:'blue'},{label:'New',color:'green'},{label:'Used',color:'yellow'},{label:'Old',color:'orange'},{label:'Very Old',color:'red'}]);
export const componentKinds=['overgrip','edgeTape','skin'];
// Planning estimates, not manufacturer lifespan claims. Each installation can override.
export const maintenanceProducts={overgrip:{label:'Overgrip',interval:2},edgeTape:{label:'Edge tape',interval:8},reload:{label:'Reload',product:'RLD-1 sheets',variant:'RLD-1',manufacturer:'Reload',interval:8},pikkl:{label:'PIKKL',manufacturer:'PIKKL',interval:8},pikklSport:{label:'PIKKL Sport Skins',product:'Sport Skins',variant:'SPSKSP13-SP13',manufacturer:'PIKKL',interval:8},pikklPro:{label:'PIKKL Pro Skins',manufacturer:'PIKKL',interval:8},custom:{label:'Other / custom',manufacturer:'',interval:8}};
export function maintenanceEvents(p){if(Array.isArray(p.maintenance))return p.maintenance;return p.overgripInstalledAt?[{id:'legacy-overgrip',kind:'overgrip',action:'install',at:p.overgripInstalledAt,product:'Existing overgrip',manufacturer:'',variant:'',notes:'Migrated existing installation date',interval:null,source:'legacy'}]:[];}
export function currentComponent(p,kind,now=Date.now()) {return maintenanceEvents(p).filter(e=>e.kind===kind&&Date.parse(e.at)<=now).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.id.localeCompare(b.id)).at(-1)??null;}
function overlap(a,b,c,d){return Math.max(0,Math.min(b,d)-Math.max(a,c));}
function covered(start,end,sessions){const ranges=sessions.map(s=>[Math.max(start,Date.parse(s.start)),Math.min(end,Date.parse(s.end))]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);let total=0,last=-Infinity;for(const [a,b] of ranges){total+=Math.max(0,b-Math.max(a,last));last=Math.max(last,b);}return total;}
export function estimateContribution(estimate,sessions,since=0,until=Infinity){
 const a=Date.parse(estimate.start),b=Date.parse(estimate.end);if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a||!Number.isFinite(estimate.estimatedHours)||estimate.estimatedHours<=0)return 0;
 const logged=sessions.flatMap(usageSegments).filter(s=>s.paddleId===estimate.paddleId);
 const known=logged.reduce((sum,s)=>sum+overlap(a,b,Date.parse(s.start),Date.parse(s.end))/3600000,0);
 const remaining=Math.max(0,estimate.estimatedHours-known),available=b-a-covered(a,b,logged);
 if(available<=0)return 0;
 const from=Math.max(a,since),to=Math.min(b,until);if(to<=from)return 0;
 return remaining*Math.max(0,to-from-covered(from,to,logged))/available;
}
export function sessionUsage(paddleId,sessions,since=0,until=Infinity){
 return sessions.reduce((sum,s)=>{if(s.estimatedHours!=null)return sum+(s.paddleId===paddleId?estimateContribution(s,sessions,since,until):0);return sum+usageSegments(s).filter(segment=>segment.paddleId===paddleId).reduce((hours,segment)=>hours+overlap(Date.parse(segment.start),Date.parse(segment.end),since,until)/3600000,0);},0);
}
// Wear is a projection of the saved log, never a live timer. A saved session's
// full start/end duration is authoritative, even when its end is later than now.
export function componentWear(p,sessions,kind,settings={}){
 const event=currentComponent(p,kind,Infinity);
 const installed=event?.action==='install';
 // Legacy records with no installation remain usable, but the UI labels the baseline unknown.
 const legacy=kind==='overgrip'&&!event;
 const interval=event?.interval??(kind==='overgrip'?settings.overgripHoursPerLevel:settings.edgeTapeHoursPerLevel)??(kind==='overgrip'?2:8);
 const hours=installed||legacy?sessionUsage(p.id,sessions,event?Date.parse(event.at):0):0;
 const estimatedHours=installed||legacy?sessions.filter(s=>s.paddleId===p.id&&s.estimatedHours!=null).reduce((n,s)=>n+estimateContribution(s,sessions,event?Date.parse(event.at):0),0):0;
 const level=Math.min(4,Math.floor((hours+1e-9)/interval));
 return {...wearLevels[level],level,hours,estimatedHours,interval,installed,legacy,event,remaining:level===4?null:Math.max(0,(level+1)*interval-hours)};
}
export function normalizeMaintenance(p){if(p.maintenance!==undefined&&!Array.isArray(p.maintenance))throw Error('Maintenance history must be a list.');const events=maintenanceEvents(p);if(events.length>5000)throw Error('Too many maintenance records.');const ids=new Set();return events.map(e=>{if(!e||typeof e.id!=='string'||!e.id||ids.has(e.id)||!componentKinds.includes(e.kind)||!['install','remove'].includes(e.action)||!Number.isFinite(Date.parse(e.at)))throw Error('Invalid maintenance event.');ids.add(e.id);if(e.interval!=null&&(!Number.isFinite(e.interval)||e.interval<0.25||e.interval>1000))throw Error('Invalid maintenance interval.');for(const k of ['product','manufacturer','variant','notes'])if(e[k]!=null&&(typeof e[k]!=='string'||e[k].length>5000))throw Error('Invalid maintenance text.');return {id:e.id,kind:e.kind,action:e.action,at:e.at,product:e.product??'',manufacturer:e.manufacturer??'',variant:e.variant??'',notes:e.notes??'',interval:e.interval??null,source:e.source==='legacy'?'legacy':'user'};});}

export function wearSessionBreakdown(p,sessions,kind){
 const event=currentComponent(p,kind,Infinity);
 if(event?.action==='remove'||!event&&kind!=='overgrip')return [];
 const since=event?Date.parse(event.at):0;
 return sessions.filter(s=>usesPaddle(s,p.id)&&Number.isFinite(Date.parse(s.start))&&Number.isFinite(Date.parse(s.end))&&Date.parse(s.end)>Date.parse(s.start)).map(s=>({id:s.id,start:s.start,end:s.end,estimated:s.estimatedHours!=null,loggedHours:s.estimatedHours??sessionUsage(p.id,[s]),countedHours:s.estimatedHours!=null?estimateContribution(s,sessions,since):sessionUsage(p.id,[s],since)})).sort((a,b)=>Date.parse(b.start)-Date.parse(a.start));
}
