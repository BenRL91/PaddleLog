import {sessionReflections,withPaddleReflections} from './pro-data.js';
import {usageSegments} from './session-segments.js';
export const MAX_PICKLEPOINT_BYTES=2000000;
const fail=m=>{throw Error(m);};
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function shape(v,allowed,required=[]){if(!isObject(v)||Object.keys(v).some(k=>!allowed.includes(k))||required.some(k=>!Object.hasOwn(v,k)))fail('Missing required fields or unsupported fields.');}
const identifier=v=>{if(typeof v!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(v))fail('Invalid source ID.');return v;};
export function utcInstant(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v)fail('Use a real UTC timestamp with milliseconds.');return v;}
const uuid=v=>{if(typeof v!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v))fail('Invalid source library UUID.');return v.toLowerCase();};
const text=(v,max)=>{if(typeof v!=='string'||v.length>max)fail('Text is invalid or too long for PaddleLog.');return v;};
export const canonicalJSON=v=>JSON.stringify(canonical(v));
function canonical(v){return isObject(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):Array.isArray(v)?v.map(canonical):v;}
export function normalizeSourceSession(s){
 shape(s,['id','revision','updatedAt','status','start','end','timezone','notes','context','timeBasis','playIntervals'],['id','revision','updatedAt','status','start','end','timeBasis','playIntervals']);
 if(s.status!=='completed'||!Number.isSafeInteger(s.revision)||s.revision<1)fail('Only completed sessions with a positive safe revision are supported.');
 const out={id:identifier(s.id),revision:s.revision,updatedAt:utcInstant(s.updatedAt),status:'completed',start:utcInstant(s.start),end:utcInstant(s.end),timeBasis:s.timeBasis,playIntervals:null};
 if(Date.parse(out.end)<=Date.parse(out.start))fail('Session end must follow start.');
 if(s.timezone!==undefined){text(s.timezone,100);if(!/^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+)*$/.test(s.timezone))fail('Invalid IANA timezone.');try{new Intl.DateTimeFormat('en',{timeZone:s.timezone});}catch{fail('Invalid IANA timezone.');}if(!s.timezone)fail('Invalid IANA timezone.');out.timezone=s.timezone;}
 if(s.notes!==undefined)out.notes=text(s.notes,10000);
 if(s.context!==undefined){shape(s.context,['location','ball','weather','netType','environment']);out.context={};for(const k of Object.keys(s.context)){if(k==='environment'&&!['indoor','outdoor','unknown'].includes(s.context[k]))fail('Invalid environment.');out.context[k]=text(s.context[k],1000);}}
 if(s.timeBasis==='recorded-play'){
  if(!Array.isArray(s.playIntervals)||!s.playIntervals.length||s.playIntervals.length>5000)fail('Recorded play requires 1–5000 intervals.');let last=Date.parse(out.start);const ids=new Set();
  out.playIntervals=s.playIntervals.map(i=>{shape(i,['id','start','end','paddleRef'],['id','start','end']);const r={id:identifier(i.id),start:utcInstant(i.start),end:utcInstant(i.end),paddleRef:null},a=Date.parse(r.start),b=Date.parse(r.end);if(ids.has(r.id)||b<=a||a<last||b>Date.parse(out.end))fail('Intervals must be unique, positive, ordered, nonoverlapping, and inside the session.');ids.add(r.id);last=b;if(i.paddleRef!=null){shape(i.paddleRef,['id','label'],['id','label']);r.paddleRef={id:identifier(i.paddleRef.id),label:text(i.paddleRef.label,2000)};if(!r.paddleRef.label.length)fail('Paddle label cannot be empty.');}return r;});
 }else if(!['session-elapsed','unknown'].includes(s.timeBasis)||s.playIntervals!==null)fail('Elapsed or unknown time requires null play intervals.');
 return out;
}
export const sourceKey=(instance,id)=>JSON.stringify(['pickle-point',instance,id]);
export const mappingKey=(instance,id)=>JSON.stringify([instance,id]);
export async function importedId(key){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));return 'pp-'+[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function parsePicklePoint(textValue){
 if(new TextEncoder().encode(textValue).length>=MAX_PICKLEPOINT_BYTES)fail('Each file must be smaller than 2,000,000 UTF-8 bytes.');
 let envelope;try{envelope=JSON.parse(textValue);}catch{fail('This file is not valid JSON.');}
 shape(envelope,['format','schemaVersion','sourceApp','sourceInstanceId','exportedAt','sessions'],['format','schemaVersion','sourceApp','sourceInstanceId','exportedAt','sessions']);
 if(envelope.format!=='leewaypb.session-export'||envelope.schemaVersion!==1||envelope.sourceApp!=='pickle-point')fail('Choose a Pickle Point v1 session export, not a backup.');
 const instance=uuid(envelope.sourceInstanceId);utcInstant(envelope.exportedAt);if(!Array.isArray(envelope.sessions)||envelope.sessions.length>10000)fail('Too many sessions in one file.');
 const counts=new Map();for(const s of envelope.sessions)if(typeof s?.id==='string')counts.set(s.id,(counts.get(s.id)||0)+1);
 const records=[],invalid=[];for(const [index,s] of envelope.sessions.entries()){try{if(counts.get(s?.id)>1)fail('Duplicate session IDs inside this file; all copies excluded.');const source=normalizeSourceSession(s);records.push({instance,source,key:sourceKey(instance,source.id)});}catch(e){invalid.push({index:index+1,message:e.message});}}
 return {records,invalid};
}
export function combineParts(parts){const groups=new Map(),invalid=parts.flatMap(p=>p.invalid),rows=[];let repeated=0;for(const r of parts.flatMap(p=>p.records)){if(!groups.has(r.key))groups.set(r.key,[]);groups.get(r.key).push(r);}for(const values of groups.values()){const max=Math.max(...values.map(r=>r.source.revision)),latest=values.filter(r=>r.source.revision===max),variants=new Set(latest.map(r=>canonicalJSON(r.source)));repeated+=values.length-1;rows.push({...latest[0],fileConflict:variants.size>1});}return {rows,invalid,repeated};}
export function localProjection(s){return {start:s.start,end:s.end,paddleId:s.paddleId,segments:usageSegments(s).map(i=>({id:i.id??'legacy',paddleId:i.paddleId,start:i.start,end:i.end})),notes:s.notes??'',...Object.fromEntries(['location','ball','weather','netType','environment'].map(k=>[k,s[k]??'']))};}
export function classifyRecord(state,row){
 const existing=state.sessions.find(s=>s.picklePoint&&sourceKey(s.picklePoint.sourceInstanceId,s.picklePoint.snapshot.id)===row.key);
 if(row.fileConflict)return {...row,status:'conflict',existing,reason:'These files contain different source content at the same revision. Export a corrected higher revision.'};
 if(!existing)return {...row,status:'new',existing:null};
 const meta=existing.picklePoint,localEdited=canonicalJSON(localProjection(existing))!==canonicalJSON(meta.applied);
 if(row.source.revision<meta.snapshot.revision)return {...row,status:'stale',existing,localEdited,reason:'Older source revision; it cannot replace the saved import.'};
 if(row.source.revision===meta.snapshot.revision)return {...row,status:canonicalJSON(row.source)===canonicalJSON(meta.snapshot)?'unchanged':'conflict',existing,localEdited,reason:'Equal revisions with different source content cannot be applied. Export a corrected higher revision.'};
 return {...row,status:'update',existing,localEdited};
}
export function normalizeProvenance(v){shape(v,['sourceApp','sourceInstanceId','snapshot','applied','importedAt','delivery'],['sourceApp','sourceInstanceId','snapshot','applied','importedAt']);if(v.sourceApp!=='pickle-point')fail('Invalid import source.');const snapshot=normalizeSourceSession(v.snapshot);shape(v.applied,['start','end','paddleId','segments','notes','location','ball','weather','netType','environment'],['start','end','paddleId','segments','notes']);const applied=structuredClone(v.applied);if(!Number.isFinite(Date.parse(applied.start))||!Number.isFinite(Date.parse(applied.end))||Date.parse(applied.end)<=Date.parse(applied.start))fail('Invalid imported baseline.');identifier(applied.paddleId);text(applied.notes,10000);for(const k of ['location','ball','weather','netType','environment'])text(applied[k]??'',1000);if(!Array.isArray(applied.segments)||!applied.segments.length||applied.segments.length>5000)fail('Invalid imported baseline intervals.');let last=Date.parse(applied.start);for(const i of applied.segments){shape(i,['id','paddleId','start','end'],['id','paddleId','start','end']);identifier(i.id);identifier(i.paddleId);const a=Date.parse(i.start),b=Date.parse(i.end);if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a||a<last||b>Date.parse(applied.end))fail('Invalid imported baseline intervals.');last=b;}if(v.delivery!==undefined&&!['file-import','api-sync'].includes(v.delivery))fail('Invalid import delivery.');return {sourceApp:'pickle-point',sourceInstanceId:uuid(v.sourceInstanceId),snapshot,applied,importedAt:utcInstant(v.importedAt),...(v.delivery?{delivery:v.delivery}:{})};}
export function normalizeMappings(rows){if(!Array.isArray(rows)||rows.length>10000)fail('Invalid source paddle mappings.');const seen=new Set();return rows.map(r=>{shape(r,['sourceInstanceId','sourcePaddleId','paddleId'],['sourceInstanceId','sourcePaddleId','paddleId']);const v={sourceInstanceId:uuid(r.sourceInstanceId),sourcePaddleId:identifier(r.sourcePaddleId),paddleId:identifier(r.paddleId)},key=mappingKey(v.sourceInstanceId,v.sourcePaddleId);if(seen.has(key))fail('Duplicate source paddle mapping.');seen.add(key);return v;});}
export function overlapWarnings(state,candidates){const warnings=[];const replaced=new Set(candidates.map(s=>s.id));const existing=state.sessions.filter(s=>!replaced.has(s.id));for(let i=0;i<candidates.length;i++){const s=candidates[i];for(const other of [...existing,...candidates.slice(0,i)]){if(other.estimatedHours!=null)continue;const a=usageSegments(s),b=usageSegments(other);if(a.some(x=>b.some(y=>Date.parse(x.start)<Date.parse(y.end)&&Date.parse(y.start)<Date.parse(x.end))))warnings.push({sessionId:s.id,otherId:other.id,message:'Recorded play overlaps another session. Check for duplicate play, even if different paddles are assigned.'});}}return warnings;}
export function buildImport(state,rows,decisions,mappings,now=new Date().toISOString(),previewOnly=false){
 const sessions=[],remember=new Map((state.settings.picklePointMappings??[]).map(m=>[mappingKey(m.sourceInstanceId,m.sourcePaddleId),m]));
 for(const row of rows){const decision=decisions.get(row.key);if(!decision||decision.action==='skip')continue;const r=classifyRecord(state,row);if(!['new','update'].includes(r.status))fail('A selected source record is unchanged, stale, or conflicting. Review the latest library.');if(r.localEdited&&!decision.replaceLocal)fail('Review and acknowledge the local edits before replacing usage.');
  const source=r.source;let segments;
  if(source.timeBasis==='recorded-play'){segments=source.playIntervals.map(i=>{const key=i.paddleRef?mappingKey(r.instance,i.paddleRef.id):JSON.stringify(['unmapped',r.key,i.id]),direct=decision.physicalPaddles?.get(i.id),paddleId=direct??mappings.get(key);if(!direct&&i.paddleRef&&paddleId)remember.set(key,{sourceInstanceId:r.instance,sourcePaddleId:i.paddleRef.id,paddleId});return {id:i.id,start:i.start,end:i.end,paddleId};});}
  else{if(!decision.usageConfirmed)fail('Elapsed-time sessions need explicit usage confirmation.');segments=(decision.manualIntervals??[]).map(i=>({...i}));}
  if(!segments?.length||segments.length>5000)fail('Enter at least one play interval.');let last=Date.parse(source.start);const ids=new Set();for(const i of segments){const p=state.paddles.find(p=>p.id===i.paddleId);if(!p)fail('Map every interval to an available physical paddle.');if(p.status!=='active'&&!decision.allowArchived)fail('Confirm use of archived or inactive paddles.');identifier(i.id);const a=Date.parse(i.start),b=Date.parse(i.end);if(ids.has(i.id)||!Number.isFinite(a)||!Number.isFinite(b)||b<=a||a<last||b>Date.parse(source.end))fail('Usage intervals must be positive, ordered, nonoverlapping, and inside the session.');ids.add(i.id);last=b;}
  const existing=r.existing??{},s={...existing,id:existing.id??r.localId,start:source.start,end:source.end,paddleId:segments[0].paddleId,segments};delete s.estimatedHours;
  if(!s.id)fail('Missing prepared import identity.');
  if(!r.existing||decision.action==='replace'){s.notes=source.notes??'';for(const k of ['location','ball','weather','netType','environment'])s[k]=source.context?.[k]??'';if(s.environment==='unknown')s.environment='';}
  if(sessionReflections(s).some(r=>!segments.some(i=>i.paddleId===r.paddleId))){if(!decision.replaceLocal)fail('This update removes a paddle with session reflections. Acknowledge that its reflection will be cleared.');Object.assign(s,withPaddleReflections(s,sessionReflections(s).filter(r=>segments.some(i=>i.paddleId===r.paddleId))));}
  if(s.manualGames)s.manualGames={...s.manualGames,games:s.manualGames.games.map(g=>g.paddleId&&!segments.some(i=>i.paddleId===g.paddleId)?{...g,paddleId:null}:g)};
  s.picklePoint={delivery:'file-import',sourceApp:'pickle-point',sourceInstanceId:r.instance,snapshot:structuredClone(source),applied:localProjection(s),importedAt:now};sessions.push(s);
 }
 if(!sessions.length)fail('Select at least one new session or reviewed update.');
 if(previewOnly)return {sessions};
 const overlaps=overlapWarnings(state,sessions);if(overlaps.length&&sessions.some(s=>overlaps.some(w=>w.sessionId===s.id)&&!decisions.get(sourceKey(s.picklePoint.sourceInstanceId,s.picklePoint.snapshot.id))?.allowOverlap))fail('Review and acknowledge overlapping play before saving.');
 const replaced=new Set(sessions.map(s=>s.id));return {...structuredClone(state),sessions:[...state.sessions.filter(s=>!replaced.has(s.id)),...sessions],settings:{...state.settings,picklePointMappings:[...remember.values()]}};
}
