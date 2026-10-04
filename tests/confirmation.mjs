import assert from 'node:assert/strict';import {askConfirm} from '../public/confirmation.js';
class Element extends EventTarget {open=false;textContent='';showModal(){this.open=true;}close(){this.open=false;this.dispatchEvent(new Event('close'));}focus(){}}
const ids=Object.fromEntries(['confirmDialog','confirmAccept','confirmCancel','confirmClose','confirmMessage','syncStatus'].map(x=>[x,new Element()]));globalThis.document={getElementById:id=>ids[id]};
let result=askConfirm('Delete session?');assert.equal(ids.confirmDialog.open,true);assert.equal(ids.confirmMessage.textContent,'Delete session?');assert.equal(await askConfirm('Duplicate'),false);ids.confirmCancel.dispatchEvent(new Event('click'));assert.equal(await result,false);assert.equal(ids.confirmDialog.open,false);
result=askConfirm('Delete session?');ids.confirmAccept.dispatchEvent(new Event('click'));assert.equal(await result,true);assert.equal(ids.confirmDialog.open,false);
result=askConfirm('Cancel with Escape');ids.confirmDialog.dispatchEvent(new Event('cancel',{cancelable:true}));assert.equal(await result,false);
result=askConfirm('Closed dialog');ids.confirmDialog.close();assert.equal(await result,false);
console.log('PASS: in-app confirmation, explicit accept, cancel, Escape, close, and duplicate-prompt guard. No browser confirm popup used.');

result=askConfirm('Cancel via X');ids.confirmClose.dispatchEvent(new Event('click'));assert.equal(await result,false);
