export const feedbackKinds=['Problem','Suggestion','Catalog correction'];
export const feedbackStatuses=['open','reviewing','planned','fixed','closed'];
const text=(v:unknown,max:number)=>{if(typeof v!=='string'||v.length>max)throw Error('Report fields exceed their limits.');return v.trim();};
export function feedbackInput(v:any){
 if(!v||typeof v.id!=='string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(v.id)||!feedbackKinds.includes(v.kind))throw Error('Invalid feedback report.');
 const message=text(v.message,4000);if(!message)throw Error('Describe your feedback.');
 const context:Record<string,string>={};if(v.context!=null){if(typeof v.context!=='object'||Array.isArray(v.context))throw Error('Invalid catalog context.');for(const [key,value] of Object.entries(v.context)){if(!['modelId','brand','model','shape','thickness','surface'].includes(key))throw Error('Unexpected catalog field.');context[key]=text(value,500);}}
 return {id:v.id,kind:v.kind,message,screen:text(v.screen??'',100),steps:text(v.steps??'',2000),version:text(v.version??'',100),context:JSON.stringify(context)};
}
