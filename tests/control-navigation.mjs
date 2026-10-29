import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {revealControl} from '../public/control-navigation.js';
const win=new Window(),doc=win.document;
doc.body.innerHTML='<details><div class="field"><label for="status">Status</label><select id="status"><option value="active">Active</option><option value="archived">Archived</option></select></div><div class="field"><input id="date" type="date"></div><div class="field"><input id="name"></div></details>';
const select=doc.getElementById('status');let scrolled=0;select.scrollIntoView=()=>scrolled++;select.focus();assert.equal(doc.activeElement,select);assert.equal(revealControl(select),true);assert.equal(doc.querySelector('details').open,true);assert.notEqual(doc.activeElement,select);assert.equal(doc.activeElement,select.parentElement);assert.equal(select.value,'active');assert.equal(scrolled,1);assert.equal(select.disabled,false);
select.dispatchEvent(new win.PointerEvent('pointerdown',{bubbles:true}));assert.equal(select.parentElement.classList.contains('control-jump-target'),false);select.focus();select.value='archived';select.dispatchEvent(new win.Event('change'));assert.equal(select.value,'archived');
revealControl(doc.getElementById('date'));assert.notEqual(doc.activeElement,doc.getElementById('date'));revealControl(doc.getElementById('name'));assert.equal(doc.activeElement,doc.getElementById('name'));select.disabled=true;assert.equal(revealControl(select),false);assert.equal(revealControl(null),false);
await win.happyDOM.abort();console.log('PASS: native picker shortcuts reveal without pre-focusing or changing values; text fields focus, collapsed sections open, disabled controls ignored, and normal activation remains available.');
