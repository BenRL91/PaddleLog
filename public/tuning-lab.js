import {photoIdValid} from './photos.js';
export const TUNING_LAB_URL='https://tune.pickleballeffect.com/';
export const tuningFields={staticWeight:{label:'Overall weight',unit:'oz',max:30},swingWeight:{label:'Swingweight',unit:'kg·cm²',max:500},twistWeight:{label:'Twistweight',unit:'kg·cm²',max:100},balancePoint:{label:'Balance point',unit:'cm',max:60}};
export function normalizeTuningLab(value){
 if(value==null)return null;
 const fail=()=>{throw Error('Invalid legacy setup metadata in this backup.');};
 if(!value||typeof value!=='object'||value.schemaVersion!==1||!photoIdValid(value.imageId)||typeof value.model!=='string'||value.model.length>200||typeof value.reviewedAt!=='string'||!Number.isFinite(Date.parse(value.reviewedAt)))fail();
 const appliedFields=value.appliedFields??[];if(!Array.isArray(appliedFields)||appliedFields.some(k=>!Object.hasOwn(tuningFields,k)))fail();const estimates={};for(const [k,f]of Object.entries(tuningFields)){const n=value.estimates?.[k];if(n!=null){if(typeof n!=='number'||!Number.isFinite(n)||n<=0||n>f.max)fail();estimates[k]=n;}}
 if(!Array.isArray(value.modifications)||value.modifications.length>40)fail();
 const modifications=value.modifications.map(m=>{if(!m||typeof m.label!=='string'||!m.label.trim()||m.label.length>200||!['top','sides','butt','grip','edge','unknown'].includes(m.zone)||![1,2].includes(m.quantity)||typeof m.gramsEach!=='number'||!Number.isFinite(m.gramsEach)||m.gramsEach<0||m.gramsEach>500)fail();return {label:m.label.trim(),zone:m.zone,quantity:m.quantity,gramsEach:m.gramsEach};});
 let crop=null;if(value.crop!=null){const c=value.crop;if(!Number.isFinite(c.top)||!Number.isFinite(c.height)||!Number.isFinite(c.imageRatio)||c.top<0||c.height<=0||c.top+c.height>1||c.imageRatio<=0||c.imageRatio>10)fail();crop={top:c.top,height:c.height,imageRatio:c.imageRatio};}
 const exportDate=value.exportDate??'';if(typeof exportDate!=='string'||exportDate.length>30)fail();
 return {schemaVersion:1,source:'Pickleball Effect Paddle Tuning Lab',url:TUNING_LAB_URL,imageId:value.imageId,model:value.model.trim(),exportDate,reviewedAt:value.reviewedAt,estimates,modifications,crop,appliedFields:[...new Set(appliedFields)]};
}
