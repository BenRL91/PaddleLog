import {createPaddleMultiSelect} from './paddle-multiselect.js';
import {createSupplies} from './supplies-ui.js';
import {costOfPlayMarkup} from './pro-insights.js';
import {markProAction} from './pro-actions.js';
import {equipmentKinds,expenseKinds} from './shared-expenses.js';
import {escapeHTML as esc} from './comparison-ui.js';
const money=(n,c)=>new Intl.NumberFormat(undefined,{style:'currency',currency:c}).format(n);
export function spendingRecords(state,paddleName){
 const rows=(state.settings?.collectionExpenses??[]).map(e=>({...e,owner:'collection',scope:'Whole collection'}));
 for(const p of state.paddles){if(typeof p.purchase?.price==='number')rows.push({id:'purchase-'+p.id,owner:p.id,purchase:true,product:paddleName(p),kind:'purchase',amount:p.purchase.price,currency:p.purchase.currency,date:p.purchase.date??'',scope:paddleName(p)});
 for(const e of p.expenses??[])if(!e.supplyId)rows.push({...e,owner:p.id,scope:paddleName(p)});}
 return rows.sort((a,b)=>b.date.localeCompare(a.date));
}
export function createCostsWorkspace({doc,getState,paddleName,authorize,navigate,getAccountId=()=>null,saveExpenses,confirm}){
 const root=doc.getElementById('viewCosts'),dialog=doc.getElementById('expensesDialog'),trigger=doc.getElementById('openExpenses');if(!root||!dialog)return {refresh(){}};
 const names={expenses:'Expenses',supplies:'Supplies',analysis:'Cost insights'};
 root.innerHTML='<div class="collection-tabs" role="tablist" aria-label="Cost views">'+Object.entries(names).map(([k,n])=>`<button class="collection-tab" type="button" role="tab" id="cost-tab-${k}" aria-controls="cost-panel-${k}">${n}</button>`).join('')+'</div>'+Object.keys(names).map(k=>`<section id="cost-panel-${k}" role="tabpanel" aria-labelledby="cost-tab-${k}" hidden></section>`).join('');
 const $=id=>doc.getElementById(id),panels=Object.fromEntries(Object.keys(names).map(k=>[k,$('cost-panel-'+k)]));let selected='expenses',mode='all';
 panels.expenses.innerHTML='<div id="costSpendingTotal"></div><div class="field"><label for="costExpenseSearch">Search expenses</label><input type="search" id="costExpenseSearch" placeholder="Item, category or paddle"></div><div class="field"><label for="costExpenseFilter">Costs to include</label><select id="costExpenseFilter"><option value="all">All costs</option><option value="equipment">Equipment</option><option value="general">General playing costs</option></select></div><div id="costExpenseHistory"></div>';
 panels.analysis.innerHTML='<div class="field"><label for="costPaddles">Paddles</label><select id="costPaddles"><option value="">All paddles</option></select></div><div id="costAnalysisBody"></div>';
 const selection=createPaddleMultiSelect({doc,select:$('costPaddles'),getPaddles:()=>getState().paddles,paddleName});
 const supplies=createSupplies({doc,root:panels.supplies,getState,getAccountId,saveExpenses,paddleName,confirm});
 markProAction($('cost-tab-analysis'),'costAnalysis','Cost insights');trigger.hidden=true;
 const add=doc.createElement('button');add.type='button';add.className='iconbtn collection-add-paddle';add.dataset.addExpenseMain='';add.hidden=true;add.setAttribute('aria-label','Add expense');add.title='Add expense';add.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';(doc.querySelector('.header-actions')??root).append(add);add.onclick=()=>{dialog.querySelector('.sheet-head h2').textContent='Add expense';trigger.click();};
 panels.expenses.prepend(dialog);dialog.after($('expenseStatus'));dialog.classList.add('collection-inline-tool');dialog.setAttribute('role','region');dialog.hidden=true;dialog.querySelector('.sheet-head h2').textContent='Add expense';
 // Keep the existing save, edit, delete and account-scoped draft logic as the single writer.
 $('expenseListFilter').closest('.field').hidden=true;$('expenseListHelp').hidden=true;$('expenseList').hidden=true;
 dialog.showModal=()=>{dialog.hidden=false;dialog.setAttribute('open','');select('expenses');navigate('costs');$('expenseProduct').focus();};
 dialog.close=()=>{dialog.hidden=true;dialog.removeAttribute('open');refresh();};
 function select(key){selected=key;for(const name of Object.keys(names)){panels[name].hidden=name!==key;const b=$('cost-tab-'+name);b.setAttribute('aria-selected',String(name===key));b.tabIndex=name===key?0:-1;}refresh();}
 function keep(e,m){return m==='all'||(m==='equipment')===(e.kind==='purchase'||equipmentKinds.includes(e.kind));}
 function rowsMarkup(rows,actions=false){return rows.map(e=>`<article class="cost-recent-row"><div><h4>${esc(e.product)}</h4><p class="small">${esc(e.date?new Date(e.date+'T12:00:00').toLocaleDateString():'Date not recorded')} · ${esc(e.kind==='purchase'?'Paddle purchase':expenseKinds[e.kind])}</p><p class="small">${esc(e.scope)}</p></div><strong>${esc(money(e.amount,e.currency))}</strong>${actions&&!e.purchase?`<details class="expense-menu"><summary class="iconbtn" aria-label="Actions for ${esc(e.product)}" title="Expense actions">⋮</summary><div class="expense-menu-panel"><button type="button" class="btn quiet" data-cost-edit="${esc(e.id)}" data-owner="${esc(e.owner)}">Edit</button><button type="button" class="btn quiet" data-cost-delete="${esc(e.id)}" data-owner="${esc(e.owner)}">Delete</button></div></details>`:''}</article>`).join('')||'<p class="empty">No matching expenses recorded.</p>';}
 function refresh(){const records=spendingRecords(getState(),paddleName);if(selected==='expenses'){const q=$('costExpenseSearch').value.trim().toLowerCase(),m=$('costExpenseFilter').value,rows=records.filter(e=>keep(e,m)),totals=new Map();for(const e of rows)totals.set(e.currency,(totals.get(e.currency)??0)+e.amount);
 $('costSpendingTotal').innerHTML='<section class="card"><h3>'+({all:'Total spent',equipment:'Equipment spending',general:'General playing costs'}[m])+'</h3>'+([...totals].map(([c,n])=>`<p class="cost-total"><strong>${esc(money(n,c))}</strong> <span class="small">${esc(c)}</span></p>`).join('')||'<p>No spending recorded yet.</p>')+'<p class="small">All-time recorded purchases for this category. Search filters the list below. Shared supply packs count once; currencies remain separate.</p></section>';
 $('costExpenseHistory').innerHTML=rowsMarkup(rows.filter(e=>[e.product,e.scope,e.kind==='purchase'?'Paddle purchase':expenseKinds[e.kind],e.notes].join(' ').toLowerCase().includes(q)),true);}else if(selected==='supplies')supplies.refresh();else renderAnalysis();}
 function renderAnalysis(){selection.refresh();const paddles=selection.selected();$('costAnalysisBody').innerHTML=paddles.length?costOfPlayMarkup(getState(),paddles,paddleName,mode):'<p>Choose one or more paddles above to see costs.</p>';}
 $('costExpenseSearch').oninput=refresh;$('costExpenseFilter').onchange=refresh;
 for(const name of ['expenses','supplies'])$('cost-tab-'+name).onclick=()=>select(name);$('cost-tab-analysis').onclick=async()=>{if(await authorize('costAnalysis'))select('analysis');};
 $('costExpenseHistory').onclick=e=>{const b=e.target.closest('[data-cost-edit],[data-cost-delete]');if(!b)return;b.closest('.expense-menu').open=false;doc.dispatchEvent(new doc.defaultView.CustomEvent('paddlelog-expense-action',{detail:{owner:b.dataset.owner,id:b.dataset.costEdit??b.dataset.costDelete,action:b.dataset.costEdit?'edit':'delete'}}));};
 doc.addEventListener('click',event=>{for(const menu of root.querySelectorAll('.expense-menu[open]'))if(!menu.contains(event.target))menu.open=false;});
 doc.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const menu=root.querySelector('.expense-menu[open]');if(menu){menu.open=false;menu.querySelector('summary').focus();}});
 doc.addEventListener('paddlelog-expenses-changed',refresh);
 panels.analysis.addEventListener('change',e=>{if(e.target.matches('[data-cost-mode]')){mode=e.target.value;refresh();}});
 root.querySelector('[role=tablist]').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const buttons=[...root.querySelectorAll('[role=tab]')],i=buttons.indexOf(doc.activeElement),n=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[n].focus();});
 $('costPaddles').onchange=async()=>{if(await authorize('costAnalysis'))renderAnalysis();};
 select('expenses');return {refresh,async openAnalysis(ids=null){if(!await authorize('costAnalysis'))return;selection.refresh();selection.chooseMany(ids);navigate('costs');select('analysis');},open(){refresh();}};
}
