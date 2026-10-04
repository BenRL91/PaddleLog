// Single product/feature policy. StoreKit prices replace targets when purchasing is enabled.
export const billingConfig=Object.freeze({
 entitlement:'paddlelog_pro',freeActivePaddles:3,freePhotosPerPaddle:1,
 freeFeatures:['dataExport'],defaultPlan:'annual',purchasesEnabled:false,
 products:{
  annual:{id:'paddlelog.pro.annual',label:'Annual',period:'year',months:12,targetPrice:14.99,currency:'USD'},
  monthly:{id:'paddlelog.pro.monthly',label:'Monthly',period:'month',months:1,targetPrice:1.99,currency:'USD'}
 },
 features:{unlimitedPaddles:true,dataExport:true,lifecycleAnalytics:true,usageStatistics:true,comparisons:true,performanceTrends:true,advancedSearch:false,multiplePhotos:false,advancedHistory:false},
 privacyUrl:'/privacy.html',termsUrl:'/terms.html'
});
export function displayPlans(products=[],locale='en-US'){
 const format=(value,currency)=>new Intl.NumberFormat(locale,{style:'currency',currency}).format(value);
 const plans=Object.entries(billingConfig.products).map(([key,p])=>{
  const live=products.find(x=>x.id===p.id&&x.period===p.period&&Number.isFinite(x.price)&&x.price>=0&&typeof x.currency==='string'&&typeof x.displayPrice==='string');
  const price=live?.price??p.targetPrice,currency=live?.currency??p.currency;
  return {...p,key,price,currency,displayPrice:live?.displayPrice??format(price,currency),authoritative:!!live,monthlyEquivalent:p.months===12?format(price/12,currency):null};
 });
 const annual=plans.find(p=>p.key==='annual'),monthly=plans.find(p=>p.key==='monthly');
 annual.bestValue=annual.authoritative===monthly.authoritative&&annual.currency===monthly.currency&&annual.price<monthly.price*12;
 return plans;
}

// Only delivered features belong in the upgrade experience. Backup is Free.
export const proBenefits=[
 {feature:'comparisons',title:'Paddle Comparisons',detail:'Compare specs, setup, usage, and available reference measurements side by side.'},
 {feature:'usageStatistics',title:'Usage Charts And Statistics',detail:'Explore weekly and monthly play, session frequency, and your most-used paddles.'},
 {feature:'lifecycleAnalytics',title:'Lifecycle Insights',detail:'Review usage and days tracked across active and archived paddles.'},
 {feature:'performanceTrends',title:'Measurement Trends',detail:'Chart recorded changes to your measurements over time.'},
 {feature:'lifecycleAnalytics',title:'Consumable Replacement Insights',detail:'Compare recorded usage between overgrip, edge-tape, and skin replacements.'},
 {feature:'unlimitedPaddles',title:'Unlimited Active Paddles',detail:'Grow your collection beyond the Free active-paddle limit.'},
];
