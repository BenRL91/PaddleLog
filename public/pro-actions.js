const featureDescriptions={comparisons:'Compare paddle specs and reference models side by side.',lifecycleAnalytics:'Explore game results, paddle performance, usage and replacement history.',setupExperiments:'Compare before-and-after game results, setup measurements and session reflections.',costAnalysis:'Review spending and cost per playing hour.'};
export function markProAction(button,feature,label){
 button.dataset.proFeature=feature;button.dataset.proLabel=label;
 button.classList.add('pro-action');
 button.replaceChildren();const text=button.ownerDocument.createElement('span');text.className='pro-action-label';text.textContent=label;
 const badge=button.ownerDocument.createElement('span');badge.className='pro-action-badge';badge.textContent='PRO';button.append(text,badge);
}
export function refreshProActions(doc,pro=false){
 for(const button of doc.querySelectorAll?.('[data-pro-feature]')??[]){
  button.classList.toggle('pro-action-locked',!pro);
  button.title=(featureDescriptions[button.dataset.proFeature]??'Explore this Pro tool.')+(pro?'':' Pro feature — opens Pro access information on Free');
  button.setAttribute('aria-label',button.dataset.proLabel+(pro?', Pro feature':', Pro feature. Opens Pro access information on Free.'));
 }
 const hint=doc.getElementById('proActionHint');if(hint){hint.hidden=pro;hint.textContent=pro?'':'PRO features open Pro access information on Free.';}
}
export function organizeProActions(doc,pro=false){
 const buttons=['comparePaddles','openAnalytics','openExperiments'].map(id=>doc.getElementById(id)).filter(Boolean);if(!buttons.length)return;
 let section=doc.getElementById('collectionProActions');if(!section){section=doc.createElement('section');section.id='collectionProActions';section.className='pro-action-toolbar';section.setAttribute('aria-label','Collection tools');section.innerHTML='<h3 class="collection-tools-title">Collection tools</h3><div class="actions"></div><p id="proActionHint" class="small"></p>';buttons[0].before(section);}
 for(const button of buttons){markProAction(button,button.id==='comparePaddles'?'comparisons':button.id==='openExperiments'?'setupExperiments':'lifecycleAnalytics',button.id==='comparePaddles'?'Compare paddles':button.id==='openExperiments'?'Setup experiments':'Insights');button.setAttribute('aria-describedby','proActionHint');section.querySelector('.actions').append(button);}
 const expenses=doc.getElementById('openExpenses');if(expenses){expenses.classList.add('collection-tool-action');section.querySelector('.actions').append(expenses);}
 refreshProActions(doc,pro);
}
