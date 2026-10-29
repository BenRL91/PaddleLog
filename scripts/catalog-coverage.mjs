import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('public/reference-catalog.json'));
const brands=new Map();
for(const row of catalog.models){
 const covered=!!row.specs?.faceMaterial&&!row.specMetadata?.pendingVerificationFields?.includes('faceMaterial');
 const b=brands.get(row.brand)??{brand:row.brand,total:0,surfaceCovered:0,remaining:[]};b.total++;if(covered)b.surfaceCovered++;else b.remaining.push({id:row.id,model:row.model});brands.set(row.brand,b);
}
const report={checkedAt:new Date().toISOString().slice(0,10),policy:'Prioritize verified current products; retain and research every historical and technical variant. Never assume material from brand or family alone.',total:catalog.models.length,surfaceCovered:[...brands.values()].reduce((n,b)=>n+b.surfaceCovered,0),brands:[...brands.values()].sort((a,b)=>a.brand.localeCompare(b.brand))};
fs.writeFileSync('data/catalog-coverage.json',JSON.stringify(report,null,2)+'\n');
console.log(`${report.surfaceCovered}/${report.total} surface records covered; ${report.total-report.surfaceCovered} remain explicitly queued.`);
