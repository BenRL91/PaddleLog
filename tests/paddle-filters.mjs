import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {createPaddleFilters,paddleFilterValues,matchesPaddleFilters} from '../public/paddle-filters.js';
const w=new Window(),doc=w.document;doc.body.innerHTML='<details class="collection-options"></details>';
let paddles=[{id:'a',brand:'Reload',shape:'Elongated',thickness:16},{id:'b',brand:'Other',shape:'Widebody',thickness:14,collectible:true}],changed=0;
const approval=(p,id)=>p.id==='a'&&id==='usap'?'APPROVED':'NOT_VERIFIED';
const ui=createPaddleFilters({doc,getPaddles:()=>paddles,getCatalog:()=>[],approval,onChange:()=>changed++});ui.refresh();
assert.match(doc.querySelector('summary').textContent,/Advanced Filters/);assert.equal(doc.getElementById('paddlePicker'),null);
const brand=doc.getElementById('filter-brand');brand.value='Reload';brand.dispatchEvent(new w.Event('change'));assert.equal(changed,1);assert.ok(ui.matches(paddles[0]));assert.equal(ui.matches(paddles[1]),false);
doc.getElementById('filter-usap').value='APPROVED';assert.ok(ui.matches(paddles[0]));doc.getElementById('filter-upa').value='APPROVED';assert.equal(ui.matches(paddles[0]),false);doc.getElementById('filter-upa').value='NOT_VERIFIED';assert.ok(ui.matches(paddles[0]));
ui.results(1);assert.match(doc.getElementById('paddleFilterResults').textContent,/1 of 2/);assert.equal(ui.active(),3);ui.refresh();assert.equal(brand.value,'Reload');doc.getElementById('clearAdvancedFilters').click();assert.equal(ui.active(),0);
assert.equal(paddleFilterValues(paddles[0],[],approval).skin,'yes');assert.equal(paddleFilterValues(paddles[1],[],approval).skin,'no');assert.ok(matchesPaddleFilters(paddleFilterValues(paddles[1],[],approval),{shape:'Widebody',thickness:'14',collectible:'yes'}));
await w.happyDOM.abort();console.log('PASS: compound filters, independent approval states, clear, counts and selection preservation.');

const hy=paddleFilterValues({shape:'Hylongated'},[]);assert.ok(matchesPaddleFilters(hy,{shape:'Hybrid'}));assert.ok(matchesPaddleFilters(hy,{shape:'Elongated'}));assert.equal(matchesPaddleFilters(paddleFilterValues({shape:'Hybrid'},[]),{shape:'Elongated'}),false);
