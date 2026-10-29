// Native selects remain the form/domain source of truth. Larger libraries get
// an accessible disclosure with search and regular keyboard-operable buttons.
export function installSearchablePaddles(doc,{threshold=20,size=30}={}){
 const selector='#mainRole,#sessionPaddle,#reflectionPaddle,#quickReflectionPaddle,#compareA,#compareB,#experimentPaddle,#expensePaddle,#supplyUsagePaddle,[data-switch-session-paddle],select[data-segment-field="paddleId"]';
 const entries=new WeakMap();
 function attach(select){
  let entry=entries.get(select);
  if(!entry&&select.options.length<=threshold)return;
  if(!entry){
   const menu=doc.createElement('details');menu.className='searchable-paddle-select';
   menu.innerHTML='<summary><span></span><span aria-hidden="true">⌄</span></summary><div class="paddle-search-panel"><label>Find a paddle<input type="search" placeholder="Brand, model or nickname"></label><div class="paddle-search-results"></div><p class="small" role="status"></p><button class="btn quiet" type="button" data-picker-more>Show more matches</button></div>';
   select.after(menu);const search=menu.querySelector('input'),results=menu.querySelector('.paddle-search-results');let count=size;
   const render=()=>{const q=search.value.trim().toLowerCase(),options=[...select.options].filter(o=>!o.disabled&&o.textContent.toLowerCase().includes(q));results.replaceChildren();for(const option of options.slice(0,count)){const b=doc.createElement('button');b.type='button';b.className='btn quiet';b.textContent=option.textContent;b.setAttribute('aria-pressed',String(option.value===select.value));b.onclick=()=>{if(select.disabled)return;select.value=option.value;menu.open=false;search.value='';entry.sync();menu.querySelector('summary').focus();select.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));if(select.isConnected){attach(select);entry.menu.querySelector('summary').focus();}};results.append(b);}menu.querySelector('[role=status]').textContent=options.length?`Showing ${Math.min(count,options.length)} of ${options.length} matches`:'No matching paddles';menu.querySelector('[data-picker-more]').hidden=count>=options.length;};
   menu.querySelector('[data-picker-more]').onclick=()=>{count+=size;render();};search.oninput=()=>{count=size;render();};
   menu.addEventListener('toggle',()=>{if(menu.open){count=size;search.value='';render();search.focus();}});
   menu.querySelector('summary').addEventListener('click',e=>{if(select.disabled)e.preventDefault();});
   entry={menu,sync(){const enabled=select.options.length>threshold;menu.hidden=!enabled;select.hidden=enabled||(select.id==='mainRole'&&!select.closest('.home-name-picker'));if(enabled){const text=select.selectedOptions[0]?.textContent??'Choose a paddle';const span=menu.querySelector('summary>span');if(span.textContent!==text)span.textContent=text;menu.querySelector('summary').setAttribute('aria-disabled',String(select.disabled));}},render};entries.set(select,entry);select.addEventListener('change',entry.sync);select.addEventListener('invalid',()=>menu.querySelector('summary').focus());
  }
  if(entry.menu.parentElement!==select.parentElement)select.after(entry.menu);entry.sync();
 }
 function refresh(){for(const select of doc.querySelectorAll(selector))attach(select);}
 const observer=new doc.defaultView.MutationObserver(records=>{if(records.some(r=>r.type==='childList'&&(r.addedNodes.length||r.removedNodes.length)&&!r.target.closest?.('.searchable-paddle-select')||r.type==='attributes'&&r.attributeName==='disabled'))refresh();});
 observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
 doc.addEventListener('click',e=>{for(const menu of doc.querySelectorAll('.searchable-paddle-select[open]'))if(!menu.contains(e.target))menu.open=false;});
 doc.addEventListener('keydown',e=>{if(e.key==='Escape'){const menu=e.target.closest?.('.searchable-paddle-select[open]');if(menu){menu.open=false;menu.querySelector('summary').focus();e.stopPropagation();}}});
 refresh();return {refresh,disconnect:()=>observer.disconnect()};
}
