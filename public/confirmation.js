let pending=false;
export function askConfirm(message){
 if(pending)return Promise.resolve(false);
 const dialog=document.getElementById('confirmDialog');
 const close=document.getElementById('confirmClose');
 const accept=document.getElementById('confirmAccept'),cancel=document.getElementById('confirmCancel');
 document.getElementById('confirmMessage').textContent=message;
 pending=true;
 return new Promise(resolve=>{
  const finish=value=>{accept.removeEventListener('click',yes);cancel.removeEventListener('click',no);close?.removeEventListener('click',no);dialog.removeEventListener('cancel',onCancel);dialog.removeEventListener('close',no);pending=false;if(dialog.open)dialog.close();resolve(value);};
  const yes=()=>finish(true),no=()=>finish(false),onCancel=e=>{e.preventDefault();no();};
  accept.addEventListener('click',yes);cancel.addEventListener('click',no);close?.addEventListener('click',no);dialog.addEventListener('cancel',onCancel);dialog.addEventListener('close',no);
  try{dialog.showModal();cancel.focus();}catch{finish(false);document.getElementById('syncStatus').textContent='Unable to open confirmation. Please reopen the app.';}
 });
}
