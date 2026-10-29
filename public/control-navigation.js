// Reveal native picker controls without putting iOS into a focused-but-closed
// input session. The user's next tap remains the native activation gesture.
export function revealControl(control){
 if(!control||control.disabled)return false;
 for(let parent=control.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
 const picker=control.tagName==='SELECT'||control.tagName==='INPUT'&&['date','datetime-local','time','month','week','file','color'].includes(control.type);
 const container=control.closest('.field')??control.parentElement;
 if(picker&&container){
  if(control.ownerDocument.activeElement===control)control.blur();
  if(!container.hasAttribute('tabindex'))container.setAttribute('tabindex','-1');
  container.focus({preventScroll:true});
 }else control.focus?.({preventScroll:true});
 control.scrollIntoView?.({block:'center',inline:'nearest',behavior:'instant'});
 if(container){container.classList.add('control-jump-target');container.addEventListener('pointerdown',()=>container.classList.remove('control-jump-target'),{once:true});}
 return true;
}
