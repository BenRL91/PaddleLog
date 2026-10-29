import assert from 'node:assert/strict';import {Window} from 'happy-dom';import {completeOrder,reorderSubset,installTouchReorder} from '../public/reorder.js';import {validate} from '../public/validate.js';
assert.deepEqual(completeOrder(['c','missing'],['a','b','c']),['c','a','b']);assert.deepEqual(reorderSubset(['a','hidden','b','c'],['a','b','c'],'c','a'),['c','hidden','a','b']);assert.deepEqual(reorderSubset(['a','b','c'],['a','b','c'],'a','c',true),['b','c','a']);assert.deepEqual(reorderSubset(['a','b'],['a','b'],'a','missing'),['a','b']);
const state=validate({paddles:[{id:'a',brand:'A',model:'A'},{id:'b',brand:'B',model:'B'}],sessions:[],usagePeriods:[],settings:{paddleOrder:['b','a','removed']}});assert.deepEqual(state.settings.paddleOrder,['b','a']);assert.deepEqual(validate(JSON.parse(JSON.stringify(state))).settings.paddleOrder,['b','a']);assert.throws(()=>validate({...state,settings:{paddleOrder:['a','a']}}));
const win=new Window();win.document.body.innerHTML='<div id="list">'+['a','b','c'].map(id=>`<details data-paddle="${id}"><summary><button data-reorder-handle="${id}">Drag</button>${id}</summary></details>`).join('')+'</div>';const list=win.document.getElementById('list');let calls=[],busy=false;for(const [i,row] of [...list.children].entries())row.getBoundingClientRect=()=>({top:i*100,height:80});installTouchReorder({list,busy:()=>busy,move:async(...args)=>calls.push(args),status:()=>{}});
const handle=list.querySelector('button'),fire=(type,y)=>handle.dispatchEvent(new win.PointerEvent(type,{bubbles:true,pointerId:1,clientY:y,button:0,isPrimary:true}));fire('pointerdown',30);fire('pointermove',260);assert.ok(list.querySelector('.reorder-target'));fire('pointerup',260);await Promise.resolve();await Promise.resolve();assert.deepEqual(calls,[['a','c',true]]);assert.equal(list.querySelector('.reorder-target'),null);
fire('pointerdown',30);fire('pointermove',150);fire('pointercancel',150);fire('pointerup',150);assert.equal(calls.length,1);busy=true;fire('pointerdown',30);fire('pointermove',250);fire('pointerup',250);assert.equal(calls.length,1);busy=false;handle.dispatchEvent(new win.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));assert.deepEqual(calls.at(-1),['a','b',true]);assert.equal(list.children[0].open,false);await Promise.resolve();await Promise.resolve();
// Threshold, unchanged drop, preview cleanup, cancellation and allowed groups.
fire('pointerdown',30);fire('pointermove',32);assert.equal(win.document.querySelector('.reorder-preview'),null);fire('pointerup',32);
const count=calls.length;
fire('pointerdown',30);fire('pointermove',55);assert.ok(win.document.querySelector('.reorder-preview'));assert.equal(list.querySelector('[data-reorder-drop]'),null);fire('pointerup',55);assert.equal(calls.length,count);assert.equal(win.document.querySelector('.reorder-preview'),null);
fire('pointerdown',30);fire('pointermove',260);win.document.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));fire('pointerup',260);assert.equal(calls.length,count);assert.equal(win.document.body.classList.contains('paddle-reordering'),false);
const other=win.document.createElement('div');other.innerHTML='<details data-paddle="x"><button data-reorder-handle="x">Drag</button></details><details data-paddle="y"><button data-reorder-handle="y">Drag</button></details>';win.document.body.append(other);
installTouchReorder({list:other,busy:()=>false,move:()=>{throw Error('Disallowed group move');},status:()=>{},canMove:()=>false});
const b=other.querySelector('button');for(const [type,y] of [['pointerdown',0],['pointermove',100],['pointerup',100]])b.dispatchEvent(new win.PointerEvent(type,{bubbles:true,pointerId:2,clientY:y,button:0,isPrimary:true}));assert.equal(other.querySelector('[data-reorder-drop]'),null);
// Desktop gallery: resolve both columns and start a purely horizontal drag.
const grid=win.document.createElement('div');grid.innerHTML=['a','b','c','d'].map(id=>`<details data-paddle="${id}"><button data-reorder-handle="${id}">Drag</button></details>`).join('');win.document.body.append(grid);
for(const [i,row] of [...grid.children].entries())row.getBoundingClientRect=()=>({left:(i%2)*320,right:(i%2)*320+300,width:300,top:Math.floor(i/2)*120,bottom:Math.floor(i/2)*120+100,height:100});
const gridCalls=[];installTouchReorder({list:grid,busy:()=>false,move:async(...args)=>{gridCalls.push(args);return true;},status:()=>{}});
async function gridDrag(id,start,end,target,after){const h=grid.querySelector(`[data-reorder-handle="${id}"]`),send=(type,point)=>h.dispatchEvent(new win.PointerEvent(type,{bubbles:true,pointerId:9,clientX:point[0],clientY:point[1],button:0,isPrimary:true}));send('pointerdown',start);send('pointermove',end);assert.ok(win.document.querySelector('.reorder-preview'));assert.equal(grid.querySelector('[data-reorder-drop]')?.dataset.paddle,target);send('pointerup',end);await Promise.resolve();await Promise.resolve();assert.deepEqual(gridCalls.at(-1),[id,target,after]);}
await gridDrag('a',[100,20],[450,200],'d',true);
await gridDrag('b',[450,20],[450,200],'d',true);
await gridDrag('d',[450,200],[450,20],'b',false);
await gridDrag('b',[450,20],[100,20],'a',false);
await gridDrag('a',[100,70],[450,70],'b',true);
// Either half of the hovered card selects the same final index.
await gridDrag('a',[100,20],[450,20],'b',true);
await gridDrag('d',[450,200],[450,90],'b',false);
assert.deepEqual(reorderSubset(['a','b','c','d'],['a','b','c','d'],'a','b',true),['b','a','c','d']);
await win.happyDOM.abort();console.log('PASS: filtered subset ordering, removed-ID cleanup, backup validation, touch pointer drag/drop, cancellation, busy guard and keyboard fallback.');
