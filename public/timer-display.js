import {paddleDurations} from './session-segments.js';
export function timerMinutes(timer,now=Date.now()){const end=timer.end??new Date(now).toISOString();return Math.max(0,Math.floor((timer.segments??[{start:timer.start}]).reduce((n,s)=>n+Math.max(0,Date.parse(s.end??end)-Date.parse(s.start)),0)/60000));}
export function elapsedLabel(minutes){return minutes>=60?Math.floor(minutes/60)+' h '+minutes%60+' min':minutes+' min';}
export function timerPaddleUsage(timer,now=Date.now()){const end=timer.end??new Date(now).toISOString();return paddleDurations({...timer,end,segments:(timer.segments??[{paddleId:timer.paddleId,start:timer.start}]).map(segment=>({...segment,end:segment.end??end}))});}
