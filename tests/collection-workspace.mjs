import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {createCollectionWorkspace} from '../public/collection-workspace.js';
const w=new Window(),doc=w.document;doc.body.innerHTML='<div id="viewPaddles"><div class="section-title"><h2>My paddles</h2><button data-add-paddle-main>Add paddle</button></div><input id="paddleSearch"><div id="paddleList"></div></div>';
let allowed=true,denied=0;
for(const [trigger,id] of [['comparePaddles','compareDialog'],['openAnalytics','analyticsDialog'],['openExpenses','expensesDialog'],['openExperiments','experimentsDialog']]){const b=doc.createElement('button');b.id=trigger;doc.getElementById('viewPaddles').append(b);const d=doc.createElement('dialog');d.id=id;d.innerHTML='<div class="sheet-head"><button class="iconbtn">Close</button></div><input>';doc.body.append(d);b.onclick=()=>d.showModal();}
createCollectionWorkspace({doc,authorize:async()=>{if(!allowed)denied++;return allowed;}});
const tick=()=>new Promise(r=>setTimeout(r,0));
assert.equal(doc.querySelectorAll('[role=tab]').length,2);
const add=doc.querySelector('.collection-heading [data-add-paddle-main]');assert.ok(add);assert.equal(add.getAttribute('aria-label'),'Add paddle');assert.ok(add.classList.contains('iconbtn'));assert.ok(add.querySelector('svg[aria-hidden=true]'));
doc.getElementById('paddleSearch').value='Saved search';
doc.getElementById('collection-tab-compare').click();await tick();const dialog=doc.getElementById('compareDialog');assert.equal(dialog.parentElement.id,'collection-panel-compare');assert.equal(doc.querySelector('.collection-tabs [aria-selected=true]').textContent,'ComparePRO');dialog.querySelector('input').value='Keep selection';
doc.getElementById('collection-tab-paddles').click();await tick();assert.equal(doc.getElementById('paddleSearch').value,'Saved search');assert.equal(dialog.parentElement.hidden,true);
doc.getElementById('collection-tab-compare').click();await tick();assert.equal(dialog.querySelector('input').value,'Keep selection');
allowed=false;doc.getElementById('collection-tab-compare').focus();doc.getElementById('collection-tab-compare').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(doc.activeElement.id,'collection-tab-paddles');assert.equal(denied,0);assert.equal(doc.getElementById('collection-tab-compare').getAttribute('aria-selected'),'true');doc.getElementById('collection-tab-compare').click();await tick();assert.equal(denied,1);assert.equal(doc.getElementById('collection-tab-compare').getAttribute('aria-selected'),'true');
const reorder=doc.getElementById('togglePaddleReorder');assert.equal(reorder.getAttribute('aria-pressed'),'false');reorder.click();assert.equal(doc.getElementById('viewPaddles').classList.contains('is-reordering'),true);assert.equal(reorder.textContent,'Done reordering');reorder.click();assert.equal(reorder.getAttribute('aria-pressed'),'false');
doc.getElementById('collectionInsights').click();assert.equal(doc.getElementById('analyticsDialog').open,true);assert.equal(doc.getElementById('analyticsDialog').classList.contains('collection-inline-tool'),false);doc.getElementById('analyticsDialog').close();
assert.equal(doc.getElementById('collection-tab-experiments'),null);
// An individual action can still present the same tool as a genuine modal.
dialog.showModal();assert.equal(dialog.parentElement,doc.body);assert.equal(dialog.classList.contains('collection-inline-tool'),false);dialog.close();
await w.happyDOM.abort();console.log('PASS: inline tabs, preserved list/form state, Pro gate and external modal path.');
