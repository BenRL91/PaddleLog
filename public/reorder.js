export function completeOrder(saved,ids){return [...(saved??[]).filter(id=>ids.includes(id)),...ids.filter(id=>!(saved??[]).includes(id))];}
// Reorder only visible slots, preserving hidden entries and their relative positions.
export function reorderSubset(order,visible,id,target,after=false){if(id===target||!visible.includes(id)||!visible.includes(target))return [...order];const moved=visible.filter(x=>x!==id),at=moved.indexOf(target)+(after?1:0);moved.splice(at,0,id);const selected=new Set(visible);let i=0;return order.map(x=>selected.has(x)?moved[i++]:x);}
export function installTouchReorder({list,busy,move,status,canMove=()=>true}){
 const doc=list.ownerDocument,win=doc.defaultView;
 let drag=null,scrollFrame=null,pending=false;
 const rows=()=>[...list.querySelectorAll('[data-paddle]')];
 const handleFor=id=>[...list.querySelectorAll('[data-reorder-handle]')].find(b=>b.dataset.reorderHandle===id);
 const name=row=>row.querySelector('.paddle-card-name')?.textContent.trim()||row.dataset.paddle;
 function clear(){
  if(scrollFrame!==null)win.cancelAnimationFrame(scrollFrame);scrollFrame=null;
  const d=drag;drag=null;d?.preview?.remove();
  list.querySelectorAll('.reorder-dragging,.reorder-target').forEach(x=>x.classList.remove('reorder-dragging','reorder-target'));
  list.querySelectorAll('[data-reorder-drop]').forEach(x=>x.removeAttribute('data-reorder-drop'));
  doc.body.classList.remove('paddle-reordering');
  try{if(d?.handle.hasPointerCapture?.(d.pointer))d.handle.releasePointerCapture(d.pointer);}catch{}
 }
 function targetAt(y){
  if(!drag)return;
  const all=rows();let best=null,distance=Infinity;
  for(const row of all){if(row.dataset.paddle!==drag.id&&!canMove(drag.id,row.dataset.paddle))continue;
   const rect=row.getBoundingClientRect(),mid=rect.top+rect.height/2;
   // Prefer the card under the pointer, then the closest edge in both dimensions.
   // Center distance only breaks ties, including the gap between grid columns.
   const left=rect.left??0,width=rect.width??0,right=rect.right??left+width,bottom=rect.bottom??rect.top+rect.height;
   const dx=width?Math.max(left-drag.x,0,drag.x-right):0,dy=Math.max(rect.top-y,0,y-bottom);
   const edge=dx*dx+dy*dy,center=(width?(drag.x-(left+width/2))**2:0)+(y-mid)**2;
   if(edge<distance||(edge===distance&&center<(best?.center??Infinity))){distance=edge;best={id:row.dataset.paddle,after:y>mid,row,center};}
  }
  if(best?.id===drag.id)best=null;
  if(best){const ids=all.map(row=>row.dataset.paddle);best.after=ids.indexOf(drag.id)<ids.indexOf(best.id);}
  // Do not offer a drop that would leave the visible order unchanged.
  if(best){const ids=all.map(r=>r.dataset.paddle),result=reorderSubset(ids,ids,drag.id,best.id,best.after);if(result.every((id,i)=>id===ids[i]))best=null;}
  const changed=drag.target?.id!==best?.id||drag.target?.after!==best?.after;
  list.querySelectorAll('.reorder-target').forEach(x=>x.classList.remove('reorder-target'));
  list.querySelectorAll('[data-reorder-drop]').forEach(x=>x.removeAttribute('data-reorder-drop'));
  if(best){best.row.classList.add('reorder-target');best.row.setAttribute('data-reorder-drop','Move here');}
  drag.target=best;
  if(changed)status(best?`Move ${drag.name} to ${name(best.row)}’s position. Release to save; Escape to cancel.`:'Return to the original position, or drag to another paddle.');
 }
 function scrollParent(){for(let el=list.parentElement;el&&el!==doc.body;el=el.parentElement){const style=win.getComputedStyle(el);if(/auto|scroll/.test(style.overflowY)&&el.scrollHeight>el.clientHeight)return el;}return null;}
 function scroll(){
  if(!drag?.active)return;
  const parent=drag.scroller,rect=parent?.getBoundingClientRect(),top=Math.max(0,rect?.top??0),bottom=Math.min(win.innerHeight,rect?.bottom??win.innerHeight)-80;
  const edge=64,y=drag.y,speed=y<top+edge?-Math.min(16,(top+edge-y)/4):y>bottom-edge?Math.min(16,(y-bottom+edge)/4):0;
  if(speed){if(parent)parent.scrollTop+=speed;else win.scrollBy(0,speed);targetAt(y);}
  scrollFrame=win.requestAnimationFrame(scroll);
 }
 async function commit(id,target,after,keyboard=false){
  if(pending||busy())return;pending=true;status('Saving paddle order…');
  try{const result=await move(id,target,after);status(result===false?'Order was not confirmed. Check the account save message.':'Paddle order saved.');}
  catch{status('Could not save the order. Please try again.');}
  finally{pending=false;const handle=handleFor(id);if(keyboard)handle?.scrollIntoView?.({block:'nearest'});handle?.focus({preventScroll:true});}
 }
 list.addEventListener('click',e=>{if(e.target.closest('[data-reorder-handle]')){e.preventDefault();e.stopPropagation();}});
 list.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&drag){e.preventDefault();clear();status('Reorder cancelled.');return;}
  const b=e.target.closest('[data-reorder-handle]');if(!b||pending||busy()||!['ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();const ids=rows().map(x=>x.dataset.paddle),i=ids.indexOf(b.dataset.reorderHandle),next=i+(e.key==='ArrowUp'?-1:1);
  if(ids[next]&&canMove(ids[i],ids[next]))void commit(ids[i],ids[next],e.key==='ArrowDown',true);
  else status('This paddle is already at the edge of its group.');
 });
 list.addEventListener('pointerdown',e=>{
  const b=e.target.closest('[data-reorder-handle]');if(!b||pending||busy()||e.isPrimary===false||e.button>0)return;
  e.preventDefault();clear();const row=b.closest('[data-paddle]');
  drag={id:b.dataset.reorderHandle,handle:b,row,name:name(row),pointer:e.pointerId,startY:e.clientY,startX:e.clientX,y:e.clientY,x:e.clientX,active:false,target:null};
  b.focus({preventScroll:true});try{b.setPointerCapture(e.pointerId);}catch{}
 });
 list.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();drag.y=e.clientY;drag.x=e.clientX;
  if(!drag.active&&Math.hypot(e.clientY-drag.startY,e.clientX-drag.startX)<6)return;
  if(!drag.active){
   drag.active=true;drag.row.classList.add('reorder-dragging');doc.body.classList.add('paddle-reordering');
   const preview=doc.createElement('div');preview.className='reorder-preview';preview.setAttribute('aria-hidden','true');
   const image=drag.row.querySelector('.collection-thumbnail');if(image){const img=image.cloneNode();img.removeAttribute('id');img.alt='';preview.append(img);}
   const label=doc.createElement('strong');label.textContent=drag.name;preview.append(label);doc.body.append(preview);drag.preview=preview;drag.scroller=scrollParent();
   status('Drag to a new position, then release to save. Escape cancels.');scrollFrame=win.requestAnimationFrame(scroll);
  }
  const width=Math.min(280,win.innerWidth-24),left=Math.max(12,Math.min(e.clientX+16,win.innerWidth-width-12));
  drag.preview.style.width=width+'px';drag.preview.style.left=left+'px';drag.preview.style.top=Math.max(12,Math.min(e.clientY-32,win.innerHeight-80))+'px';
  targetAt(e.clientY);
 });
 list.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointer)return;const d=drag;clear();if(d.active&&d.target)void commit(d.id,d.target.id,d.target.after);else if(d.active)status('Paddle order unchanged.');});
 const cancel=()=>{if(drag){const active=drag.active;clear();if(active)status('Reorder cancelled.');}};
 list.addEventListener('pointercancel',cancel);list.addEventListener('lostpointercapture',cancel);win?.addEventListener('blur',cancel);
 doc.addEventListener('scroll',()=>{if(drag?.active)targetAt(drag.y);},true);
 doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();cancel();}});
}
