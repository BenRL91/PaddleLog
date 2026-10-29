import {usesPaddle} from './session-segments.js';
import {sessionUsage,maintenanceEvents,componentKinds} from './maintenance.js';
export const trendFields={staticWeight:'Static weight (oz)',swingWeight:'Swingweight (kg·cm²)',twistWeight:'Twistweight (kg·cm²)',serveSpeed:'Serve speed (mph)',volleySpeed:'Volley speed (mph)'};
const validSession=s=>Number.isFinite(Date.parse(s.start))&&Date.parse(s.end)>Date.parse(s.start);
export function usageSplit(paddleId,sessions,start=0,end=Infinity){const valid=sessions.filter(validSession);const total=sessionUsage(paddleId,valid,start,end),logged=sessionUsage(paddleId,valid.filter(s=>s.estimatedHours==null),start,end);return {logged,estimated:Math.max(0,total-logged),total};}
// Calendar buckets in the viewer's local timezone. Half-open boundaries avoid double counting.
export function usageBuckets(paddles,sessions,period='week',now=Date.now(),count=12){
 const end=new Date(now);end.setHours(0,0,0,0);if(period==='month'){end.setDate(1);end.setMonth(end.getMonth()+1);}else{end.setDate(end.getDate()-((end.getDay()+6)%7)+7);}
 const buckets=[];for(let n=0;n<count;n++){const start=new Date(end);if(period==='month')start.setMonth(start.getMonth()-1);else start.setDate(start.getDate()-7);const sums=paddles.reduce((acc,p)=>{const u=usageSplit(p.id,sessions,+start,+end);acc.logged+=u.logged;acc.estimated+=u.estimated;return acc;},{logged:0,estimated:0});buckets.unshift({start:+start,end:+end,...sums,total:sums.logged+sums.estimated});end.setTime(+start);}return buckets;
}
export function lifecycle(p,sessions,now=Date.now()){
 const added=Date.parse(p.createdAt),archive=p.status==='archived'?Date.parse(p.archivedAt):NaN,stop=Number.isFinite(archive)?Math.min(archive,now):now;
 const days=Number.isFinite(added)&&added<=stop?(stop-added)/86400000:null;
 const logged=sessions.filter(s=>usesPaddle(s,p.id)&&s.estimatedHours==null&&validSession(s));
 const recent=logged.filter(s=>Date.parse(s.start)>=now-30*86400000&&Date.parse(s.start)<=now).length;
 return {days,added:Number.isFinite(added)?added:null,archived:Number.isFinite(archive)?archive:null,status:p.status??'active',sessionCount:logged.length,recentSessions:recent,usage:usageSplit(p.id,sessions)};
}
export function performancePoints(p,key){if(!(key in trendFields))return [];const rows=(p.measurements??[]).filter(m=>Number.isFinite(Date.parse(m.at))).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));const result=[];for(const m of rows){const raw=m.values?.[key];if(raw==null||raw===''||typeof raw==='boolean')continue;const value=Number(raw);if(!Number.isFinite(value)||value<0)continue;const last=result.at(-1);if(last&&last.value===value)continue;result.push({at:Date.parse(m.at),value});}return result;}
export function maintenanceCycles(p,sessions,now=Date.now()){
 const result=[];for(const kind of componentKinds){const events=maintenanceEvents(p).filter(e=>e.kind===kind&&Number.isFinite(Date.parse(e.at))).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.id.localeCompare(b.id));for(let i=0;i<events.length;i++){const e=events[i];if(e.action!=='install')continue;const next=events[i+1];result.push({kind,product:e.product||kind,start:Date.parse(e.at),end:next?Date.parse(next.at):null,closed:!!next,usage:usageSplit(p.id,sessions,Date.parse(e.at),next?Date.parse(next.at):Infinity)});}}return result.sort((a,b)=>b.start-a.start);
}

// Completed replacement habits, recomputed from authoritative usage records.
// Group by component and recorded product so unrelated products are not pooled.
export function consumableComparison(paddles,sessions){
 return paddles.flatMap(p=>{
  const groups=new Map();
  for(const cycle of maintenanceCycles(p,sessions)){
   const key=JSON.stringify([cycle.kind,cycle.product]);
   if(!groups.has(key))groups.set(key,{paddleId:p.id,kind:cycle.kind,product:cycle.product,completed:[],current:null});
   const group=groups.get(key);
   if(cycle.closed)group.completed.push(cycle.usage);
   else group.current=cycle.usage;
  }
  return [...groups.values()].map(({completed,...group})=>{
   const count=completed.length,sum=completed.reduce((a,u)=>({total:a.total+u.total,logged:a.logged+u.logged,estimated:a.estimated+u.estimated}),{total:0,logged:0,estimated:0});
   return {...group,count,average:count?sum.total/count:null,loggedAverage:count?sum.logged/count:null,estimatedAverage:count?sum.estimated/count:null,min:count?Math.min(...completed.map(u=>u.total)):null,max:count?Math.max(...completed.map(u=>u.total)):null};
  });
 });
}
