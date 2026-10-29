import {sessionUsage} from './maintenance.js';
import {usageSegments} from './session-segments.js';
export function createUsageCache(){
 let source=null,index=new Map(),totals=new Map();
 function reset(sessions){source=sessions;index=new Map();totals=new Map();for(const session of sessions){const ids=session.estimatedHours!=null?[session.paddleId]:new Set(usageSegments(session).map(s=>s.paddleId));for(const id of ids){if(!index.has(id))index.set(id,[]);index.get(id).push(session);}}}
 return {reset,hours(id,sessions){if(source!==sessions)reset(sessions);if(!totals.has(id))totals.set(id,sessionUsage(id,index.get(id)??[]));return totals.get(id);}};
}
export function createCollectionWindow({doc,list,onMore,onOpen,size=30}){
 let limit=size,key='',total=0;
 const controls=doc.createElement('div');controls.className='collection-pagination';controls.innerHTML='<p class="small" role="status"></p><button class="btn" type="button">Load more paddles</button>';list.after(controls);
 controls.querySelector('button').onclick=()=>{const previous=limit;limit+=size;onMore();const next=list.querySelectorAll('.paddle-accordion>summary')[previous];next?.focus({preventScroll:true});next?.scrollIntoView?.({block:'nearest'});};
 list.addEventListener('toggle',event=>{const card=event.target;if(card.matches?.('.paddle-accordion')&&card.open)onOpen(card);},true);
 return {page(rows,context=''){const signature=context+'|'+rows.map(p=>p.id).sort().join('|');if(signature!==key){key=signature;limit=size;}total=rows.length;return rows.slice(0,limit);},refresh(){controls.hidden=total<=size;controls.querySelector('p').textContent=`Showing ${Math.min(total,limit)} of ${total} paddles`;controls.querySelector('button').hidden=limit>=total;},reset(){key='';limit=size;}};
}
