import {markProAction,refreshProActions} from './pro-actions.js';
export function createCollectionWorkspace({doc,authorize}){
 const root=doc.getElementById('viewPaddles');if(!root)return;
 const title=doc.createElement('div');title.className='section-title collection-heading';title.innerHTML='<h2>Your collection</h2>';
 const add=root.querySelector('[data-add-paddle-main]');if(add){add.type='button';add.className='iconbtn collection-add-paddle';add.setAttribute('aria-label','Add paddle');add.title='Add paddle';add.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';const header=doc.querySelector('.header-actions');if(header){header.append(add);add.hidden=doc.body.dataset.page!=='paddles';title.hidden=true;}else title.append(add);}
 const tabs=doc.createElement('div');tabs.className='collection-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Collection views');
 const list=doc.createElement('section');list.id='collection-panel-paddles';list.setAttribute('role','tabpanel');
 while(root.firstChild)list.append(root.firstChild);root.append(title,tabs,list);
 const oldTitle=list.querySelector('.section-title');oldTitle?.remove();
 const tools=doc.getElementById('collectionProActions');if(tools)tools.hidden=true;
 const configs=[['paddles','Collection'],['compare','Compare','comparePaddles','compareDialog','comparisons']];
 const shortcuts=doc.createElement('div');shortcuts.className='collection-shortcuts';
 const insights=doc.createElement('button');insights.type='button';insights.className='btn quiet';insights.id='collectionInsights';markProAction(insights,'lifecycleAnalytics','Collection insights');insights.onclick=()=>doc.getElementById('openAnalytics')?.click();
 const reorder=doc.createElement('button');reorder.type='button';reorder.className='btn quiet';reorder.id='togglePaddleReorder';reorder.setAttribute('aria-controls','paddleList');
 function setReorder(enabled){root.classList.toggle('is-reordering',enabled);reorder.setAttribute('aria-pressed',String(enabled));reorder.textContent=enabled?'Done reordering':'Reorder';const help=doc.getElementById('reorderHelp');if(help)help.hidden=!enabled;}
 reorder.onclick=()=>setReorder(!root.classList.contains('is-reordering'));setReorder(false);
 shortcuts.append(insights,reorder);const totals=list.querySelector('.hero');if(totals)totals.after(shortcuts);else list.prepend(shortcuts);

 let selected='paddles',pending=null,busy=false;
 const panels=new Map([['paddles',list]]),buttons=new Map();
 function select(key){selected=key;for(const [id,panel] of panels)panel.hidden=id!==key;for(const [id,button] of buttons){button.setAttribute('aria-selected',String(id===key));button.tabIndex=id===key?0:-1;}}
 for(const [key,label,triggerId,dialogId,feature] of configs){
  const tab=doc.createElement('button');tab.type='button';tab.className='collection-tab';tab.id='collection-tab-'+key;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','collection-panel-'+key);tab.textContent=label;if(feature)markProAction(tab,feature,label);tabs.append(tab);buttons.set(key,tab);
  if(key==='paddles'){list.setAttribute('aria-labelledby',tab.id);}else{
   const dialog=doc.getElementById(dialogId),trigger=doc.getElementById(triggerId);if(!dialog||!trigger)continue;
   let restoreInline=false;const nativeShow=dialog.showModal.bind(dialog),nativeClose=dialog.close.bind(dialog);const panel=doc.createElement('section');panel.id='collection-panel-'+key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.hidden=true;root.append(panel);panels.set(key,panel);
   dialog.showModal=()=>{if(pending===key){pending=null;panel.append(dialog);dialog.classList.add('collection-inline-tool');dialog.setAttribute('role','region');dialog.setAttribute('open','');dialog.querySelector('.sheet-head .iconbtn').hidden=true;select(key);}else{if(dialog.classList.contains('collection-inline-tool')){restoreInline=true;dialog.removeAttribute('open');dialog.classList.remove('collection-inline-tool');dialog.removeAttribute('role');dialog.querySelector('.sheet-head .iconbtn').hidden=false;doc.body.append(dialog);}nativeShow();}};
   dialog.close=()=>{if(dialog.classList.contains('collection-inline-tool')){dialog.removeAttribute('open');if(selected===key)select('paddles');}else{nativeClose();if(restoreInline){restoreInline=false;panel.append(dialog);dialog.classList.add('collection-inline-tool');dialog.setAttribute('role','region');dialog.setAttribute('open','');dialog.querySelector('.sheet-head .iconbtn').hidden=true;}}};
  }
  tab.addEventListener('click',async()=>{if(busy)return;if(key==='paddles'){select(key);return;}busy=true;try{if(!await authorize(feature))return;const dialog=doc.getElementById(dialogId);if(dialog.classList.contains('collection-inline-tool')&&dialog.open){select(key);return;}pending=key;doc.getElementById(triggerId).click();}finally{busy=false;}});
 }
 tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const all=[...buttons.values()],index=all.indexOf(doc.activeElement);const next=e.key==='Home'?0:e.key==='End'?all.length-1:(index+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;all[next].focus();all[next].scrollIntoView?.({block:'nearest',inline:'nearest'});});
 select('paddles');refreshProActions(doc,false);
 return {reset(){pending=null;setReorder(false);select('paddles');}};
}
