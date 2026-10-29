// A session owns its context; consecutive segments own paddle usage. Legacy
// single-paddle records remain readable without rewriting their saved data.
export function usageSegments(session){
 if(session.estimatedHours!=null)return [];
 const rows=Array.isArray(session.segments)?session.segments:[{paddleId:session.paddleId,start:session.start,end:session.end}];
 return rows.filter(s=>typeof s.paddleId==='string'&&Number.isFinite(Date.parse(s.start))&&Date.parse(s.end)>Date.parse(s.start));
}
export const usesPaddle=(session,id)=>session.estimatedHours!=null?session.paddleId===id:usageSegments(session).some(s=>s.paddleId===id);
export function paddleDurations(session){const totals=new Map();for(const s of usageSegments(session))totals.set(s.paddleId,(totals.get(s.paddleId)??0)+(Date.parse(s.end)-Date.parse(s.start))/3600000);return [...totals].map(([paddleId,hours])=>({paddleId,hours}));}
export function normalizeSegments(session,paddleIds){
 if(session.segments===undefined)return undefined;
 if(session.estimatedHours!=null||!Array.isArray(session.segments)||!session.segments.length||session.segments.length>5000)throw Error('Invalid paddle usage segments.');
 const ids=new Set();let end=Date.parse(session.start);
 return session.segments.map(s=>{const a=Date.parse(s?.start),b=Date.parse(s?.end);if(!s||typeof s.id!=='string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(s.id)||ids.has(s.id)||!paddleIds.has(s.paddleId)||typeof s.start!=='string'||typeof s.end!=='string'||!Number.isFinite(a)||!Number.isFinite(b)||b<=a||a<end||b>Date.parse(session.end))throw Error('Paddle usage segments must have valid paddles and non-overlapping times within the session.');ids.add(s.id);end=b;return {id:s.id,paddleId:s.paddleId,start:s.start,end:s.end};});
}
// Used by timer UI now, and future game/point integrations. No game durations
// are inferred: a switch is an explicit timestamped event.
export function switchTimerPaddle(timer,paddleId,at,id){
 if(timer.end)throw Error('This session has ended.');
 if(timer.paddleId===paddleId)return timer;
 if(timer.pausedAt)return {...timer,paddleId};
 const rows=timer.segments??[{id:timer.id+'-initial',paddleId:timer.paddleId,start:timer.start}];
 const last=rows.at(-1),time=Date.parse(at);
 if(!Number.isFinite(time)||time<Date.parse(last.start))throw Error('Paddle switch time is before the current segment. Check your device clock.');
 // An instantaneous switch replaces a zero-duration segment rather than
 // recording invalid usage or assigning the same instant twice.
 const previous=time===Date.parse(last.start)?rows.slice(0,-1):[...rows.slice(0,-1),{...last,end:at}];
 return {...timer,paddleId,segments:[...previous,{id,paddleId,start:at}]};
}
export function finishTimer(timer,at){
 const end=timer.end??at,rows=timer.segments??[{id:timer.id+'-initial',paddleId:timer.paddleId,start:timer.start}];
 if(!Number.isFinite(Date.parse(end))||Date.parse(end)<=Date.parse(timer.start)||Date.parse(end)<Date.parse(timer.pausedAt??rows.at(-1)?.start??timer.start))throw Error('The session must end after it starts. Check your device clock.');
 const segments=rows.map((s,i)=>i===rows.length-1&&!s.end?{...s,end}:s).filter(s=>Date.parse(s.end)>Date.parse(s.start));
 if(!segments.length)throw Error('No play time recorded. Resume to play, or discard this timer.');
 const next={...timer,paddleId:segments[0].paddleId,end,segments};delete next.pausedAt;return next;
}
// Deleting a paddle removes only that paddle's usage, preserving the other
// paddles and shared session context. Gaps represent removed usage, not reallocation.
export function withoutPaddle(session,paddleId){
 if(session.manualGames)session={...session,manualGames:{...session.manualGames,games:session.manualGames.games.map(g=>g.paddleId===paddleId?{...g,paddleId:null}:g)}};
 if(!usesPaddle(session,paddleId))return session;
 if(!Array.isArray(session.segments))return null;
 const segments=session.segments.filter(s=>s.paddleId!==paddleId);
 return segments.length?{...session,paddleId:segments[0].paddleId,segments,...(session.paddleReflections?{paddleReflections:session.paddleReflections.filter(r=>r.paddleId!==paddleId),reflection:session.paddleReflections.find(r=>r.paddleId!==paddleId)??null}:session.reflection?.paddleId===paddleId?{reflection:null}:{})}:null;
}
export function pauseTimer(timer,at){
 if(timer.end||timer.pausedAt)return timer;
 const rows=timer.segments??[{id:timer.id+'-initial',paddleId:timer.paddleId,start:timer.start}],last=rows.at(-1),time=Date.parse(at);
 if(!Number.isFinite(time)||time<Date.parse(last?.start??timer.start))throw Error('Pause time is before recorded play. Check your device clock.');
 return {...timer,pausedAt:at,segments:time===Date.parse(last.start)?rows.slice(0,-1):[...rows.slice(0,-1),{...last,end:at}]};
}
export function resumeTimer(timer,at,id){
 if(timer.end||!timer.pausedAt)return timer;
 if(!Number.isFinite(Date.parse(at))||Date.parse(at)<Date.parse(timer.pausedAt))throw Error('Resume time is before the pause. Check your device clock.');
 const next={...timer,segments:[...(timer.segments??[]),{id,paddleId:timer.paddleId,start:at}]};delete next.pausedAt;return next;
}
