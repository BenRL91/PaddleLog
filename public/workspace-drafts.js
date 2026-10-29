// Device-local drafts, isolated by account and tool. Never stored in shared app data.
export function formDraft({doc,formId,fields,getAccountId,statusId}){
 const form=doc.getElementById(formId),status=doc.getElementById(statusId),storage=doc.defaultView?.localStorage;
 let owner=getAccountId();
 const key=()=>{const account=getAccountId();return account?'paddlelog.workspace-draft.v1:'+account+':'+formId:null;};
 function capture(){const k=key();if(!k||owner!==getAccountId())return;try{const values=Object.fromEntries(fields.map(id=>[id,doc.getElementById(id).value]));storage.setItem(k,JSON.stringify({values,updatedAt:Date.now()}));}catch{status.textContent='This device could not keep a draft. Keep this screen open until saving succeeds.';}}
 function restore(valid=()=>true){if(owner!==getAccountId())form.reset();owner=getAccountId();const k=key();if(!k)return false;try{const raw=storage.getItem(k);if(!raw)return false;const draft=JSON.parse(raw);if(!draft?.values||!valid(draft.values)){status.textContent='A draft could not be restored because its paddle or record is no longer available. Discard it to start again.';return false;}for(const id of fields)if(typeof draft.values[id]==='string')doc.getElementById(id).value=draft.values[id];status.textContent='Draft restored on this device. Review it before saving.';return true;}catch{status.textContent='The device draft could not be read. Discard it to start again.';return false;}}
 function clear(){const k=key();if(!k)return;try{storage.removeItem(k);}catch{status.textContent='Saved, but this device could not remove the draft. Review any restored entries before saving again.';}}
 for(const event of ['input','change'])form.addEventListener(event,capture);
 return {capture,restore,clear};
}
