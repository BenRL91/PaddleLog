// Native validation with persistent, field-associated explanations.
export function installFormFeedback(doc){
 const errors=new WeakMap();let sequence=0;
 function show(field){
  if(!field.matches?.('input,select,textarea')||field.disabled)return;
  for(let parent=field.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  let error=errors.get(field);
  if(!error){error=doc.createElement('p');error.id=`fieldError-${++sequence}`;error.className='field-error';field.insertAdjacentElement('afterend',error);errors.set(field,error);}
  const ids=new Set((field.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(error.id);field.setAttribute('aria-describedby',[...ids].join(' '));
  field.setAttribute('aria-invalid','true');error.hidden=false;error.textContent=field.validationMessage||'Check this value before saving.';
 }
 function update(field){const error=errors.get(field);if(!error)return;if(field.validity.valid){field.removeAttribute('aria-invalid');error.hidden=true;error.textContent='';}else show(field);}
 doc.addEventListener('invalid',e=>show(e.target),true);
 for(const event of ['input','change'])doc.addEventListener(event,e=>update(e.target));
 doc.addEventListener('reset',e=>{for(const field of e.target.elements||[]){const error=errors.get(field);if(error){field.removeAttribute('aria-invalid');error.hidden=true;error.textContent='';}}});
}
