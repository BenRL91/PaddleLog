// Single product/feature policy. StoreKit prices replace targets when purchasing is enabled.
export const billingConfig=Object.freeze({
 entitlement:'paddlelog_pro',freePaddles:5,freePhotosPerPaddle:1,
 freeFeatures:['dataExport'],defaultPlan:'annual',purchasesEnabled:false,
 products:{
  annual:{id:'paddlelog.pro.annual',label:'Annual',period:'year',months:12,targetPrice:14.99,currency:'USD'},
  monthly:{id:'paddlelog.pro.monthly',label:'Monthly',period:'month',months:1,targetPrice:1.99,currency:'USD'}
 },
 features:{setupExperiments:true,costAnalysis:true,sessionPatterns:true,unlimitedPaddles:true,dataExport:true,lifecycleAnalytics:true,usageStatistics:true,comparisons:true,performanceTrends:true,advancedSearch:false,multiplePhotos:false,advancedHistory:false},
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
 {feature:'comparisons',title:'Paddle Comparisons',detail:'Compare owned and catalog paddles, highlight differences, and save pairs.'},
 {feature:'usageStatistics',title:'Usage Charts And Statistics',detail:'Compare date ranges and prior periods, with usage share and condition filters.'},
 {feature:'lifecycleAnalytics',title:'Game Results & Player History',detail:'Filter results, compare periods, explore close games and review performance with partners and opponents.'},
 {feature:'lifecycleAnalytics',title:'Lifecycle Insights',detail:'Review usage and days tracked across active and archived paddles.'},
 {feature:'performanceTrends',title:'Measurement Trends',detail:'Chart recorded changes to your measurements over time.'},
 {feature:'lifecycleAnalytics',title:'Consumable Replacement Insights',detail:'Compare recorded usage between overgrip, edge-tape, and skin replacements.'},
 {feature:'setupExperiments',title:'Setup Experiments',detail:'Compare before-and-after game results, configurations and linked session reflections.'},
 {feature:'costAnalysis',title:'Cost Of Play',detail:'Understand paddle and consumable spending per playing hour.'},
 {feature:'sessionPatterns',title:'Session Patterns',detail:'Explore control, power, comfort and confidence by paddle, setup and conditions.'},
 {feature:'unlimitedPaddles',title:'Unlimited Paddles',detail:'Grow your collection beyond the Free five-paddle limit.'},
];
