import {billingConfig,displayPlans,proBenefits} from './billing-config.js';
import {entitlementClient} from './entitlement-client.js';
import {purchasing} from './purchases.js';
const contexts={lifecycleAnalytics:'Usage charts, lifecycle summaries, recorded performance trends and consumable replacement insights are included with PaddleLog Pro. Your basic hours and history remain available for free.',comparisons:'Side-by-side paddle and source-reference comparisons are included with PaddleLog Pro. Your recorded specs remain available in each paddle.',unlimitedPaddles:'Free includes three active paddles. Pro gives your collection room to grow. You can still view and manage every paddle you already own.',general:'Keep tracking for free. Upgrade for deeper insights, comparisons, and paddle history.'};
const allowedEvents=new Set(['paywall_viewed','monthly_selected','annual_selected','purchase_initiated','purchase_completed','purchase_failed','purchase_cancelled','restore_initiated','restore_successful','pro_feature_attempted','free_paddle_limit_reached']);
export function createBilling({document:doc,fetcher=fetch,clock=Date.now,onChange=()=>{},analytics=null,provider=null,verifier=null,configuration=billingConfig}){
 const $=id=>doc.getElementById(id),client=entitlementClient(fetcher,clock);
 let selected=billingConfig.defaultPlan,plans=displayPlans(),busy=false,source='general',service=null,account=null,productsLoaded=false;
 // Optional integration only. No analytics SDK, identifiers or payment payloads are sent.
 const event=(name)=>{if(allowedEvents.has(name))try{analytics?.({name,source,plan:selected});}catch{}};
 const status=message=>{$('billingStatus').textContent=message;};
 function render(){
  const benefits=doc.querySelector('.pro-features');if(benefits){benefits.replaceChildren();for(const item of proBenefits.filter(x=>configuration.features?.[x.feature])){const li=doc.createElement('li'),title=doc.createElement('strong');title.textContent=item.title;li.append(title,doc.createTextNode(' — '+item.detail));benefits.append(li);}}
  const snapshot=client.snapshot();$('planStatus').textContent=snapshot.unknown?'Plan status unavailable — your data remains safe.':snapshot.pro?'PaddleLog Pro':'PaddleLog Free';
  $('proReason').textContent=(contexts[source]??contexts.general).replace('three',String(billingConfig.freeActivePaddles));
  for(const plan of plans){const label=$(plan.key+'Price');label.textContent=plan.displayPrice+'/'+plan.period;$(plan.key+'Value').textContent=plan.key==='annual'?(plan.bestValue?'Best Value':'Annual plan'):'';$(plan.key+'Equivalent').textContent=plan.monthlyEquivalent?'About '+plan.monthlyEquivalent+'/month, billed annually.':'';$(plan.key+'Plan').checked=selected===plan.key;$(plan.key+'Plan').disabled=busy;}
  const plan=plans.find(p=>p.key===selected),live=!!service&&productsLoaded&&configuration.purchasesEnabled&&plan.authoritative;
  $('billingAvailability').textContent=live?'Price shown is supplied by the App Store.':'Planned US pricing. Subscriptions are not available for purchase in this build.';
  $('purchasePro').disabled=busy||!live||snapshot.pro;
  $('purchasePro').textContent=busy?'Please wait…':snapshot.pro?'Pro is active':live?'Subscribe — '+plan.displayPrice+'/'+plan.period:'Purchases not available yet';
  $('restorePro').disabled=busy;$('closePro').disabled=busy;
 }
 async function refresh(){try{const s=await client.refresh();onChange(s);render();return s;}catch(e){render();throw e;}}
 async function show(context='general'){
  source=context in contexts?context:'general';selected=billingConfig.defaultPlan;status('');render();
  if(! $('proDialog').open)$('proDialog').showModal();event('paywall_viewed');
  if(source!=='general')event('pro_feature_attempted');if(source==='unlimitedPaddles')event('free_paddle_limit_reached');
  try{await refresh();}catch(e){status(e.message);}
  if(service&&configuration.purchasesEnabled){status('Loading App Store prices…');try{plans=displayPlans(await service.products());productsLoaded=true;status('');}catch{productsLoaded=false;status('Could not load prices. Check your connection and reopen this screen.');}render();}
 }
 async function purchase(){if(busy||!service||!configuration.purchasesEnabled||!productsLoaded)return;const plan=plans.find(p=>p.key===selected);if(!plan?.authoritative)return;
  busy=true;render();status('Waiting for the App Store…');event('purchase_initiated');try{const result=await service.purchase(plan.id);if(result.status==='cancelled'){status('Purchase cancelled. Nothing in your library changed.');event('purchase_cancelled');}else if(result.status==='pending'){status('Purchase is pending approval. Your library remains available.');}else {const s=await refresh();if(s.pro){status('PaddleLog Pro is active.');event('purchase_completed');}else status('Purchase received. Access is still syncing; use Restore purchases to retry.');}}
  catch{status('Purchase could not be completed or verified. Your data is safe. If charged, use Restore purchases to retry synchronization.');event('purchase_failed');}finally{busy=false;render();}
 }
 async function restore(){if(busy)return;event('restore_initiated');if(!service||!configuration.purchasesEnabled){status('Apple purchase restoration is not connected in this build. No purchase was made and your library is unchanged.');return;}busy=true;render();status('Restoring purchases…');try{await service.restore();const s=await refresh();status(s.pro?'Purchases restored. PaddleLog Pro is active.':'No active Pro subscription was found for this account. Existing data remains safe.');event('restore_successful');}catch{status('Could not restore purchases. Check your connection and Apple account, then retry.');}finally{busy=false;render();}}
 $('openPro').addEventListener('click',()=>show());$('purchasePro').addEventListener('click',purchase);$('restorePro').addEventListener('click',restore);$('closePro').addEventListener('click',()=>{if(!busy)$('proDialog').close();});$('proDialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 for(const key of ['annual','monthly'])$(key+'Plan').addEventListener('change',()=>{selected=key;event(key+'_selected');render();});
 $('proTerms').href=billingConfig.termsUrl;$('proPrivacy').href=billingConfig.privacyUrl;
 return {show,refresh,snapshot:()=>client.snapshot(),useAccount(id){if(id!==account){account=id;client.useAccount(id);plans=displayPlans();productsLoaded=false;service=provider&&verifier?purchasing(provider,verifier,id):null;render();}},clear(){account=null;client.clear();service=null;plans=displayPlans();productsLoaded=false;render();}};
}
