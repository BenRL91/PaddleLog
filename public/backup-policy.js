// Recovery is a core reliability feature, independent of payment entitlements.
export const backupPolicy=Object.freeze({recent:20,weekly:8,monthly:6,preserveOldest:true});
export function selectBackupRetention(objects,now=Date.now()){
 const known=objects.filter(x=>/\d{12}\.json$/.test(x.key)).sort((a,b)=>b.key.localeCompare(a.key));const keep=new Set(known.slice(0,backupPolicy.recent).map(x=>x.key));if(known.length&&backupPolicy.preserveOldest)keep.add(known.at(-1).key);
 const weeks=new Set(),months=new Set();const monthStart=new Date(now);monthStart.setUTCDate(1);monthStart.setUTCMonth(monthStart.getUTCMonth()-(backupPolicy.monthly-1));monthStart.setUTCHours(0,0,0,0);
 for(const o of known){const time=new Date(o.uploaded??o.createdAt).getTime();if(!Number.isFinite(time)){keep.add(o.key);continue;}const d=new Date(time);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));const week=d.toISOString().slice(0,10),month=new Date(time).toISOString().slice(0,7);
  if(time>=now-backupPolicy.weekly*7*86400000&&weeks.size<backupPolicy.weekly&&!weeks.has(week)){weeks.add(week);keep.add(o.key);}
  if(time>=monthStart.getTime()&&months.size<backupPolicy.monthly&&!months.has(month)){months.add(month);keep.add(o.key);}
 }
 return {keep:[...keep],remove:known.filter(o=>!keep.has(o.key)).map(o=>o.key)};
}
