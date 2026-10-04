// User-entered profile only. Provider-verified ratings must remain server-owned.
export function normalizePlayerProfile(raw){
 if(raw==null)return null;
 if(typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid player profile.');
 const text=(key,max=100)=>{const v=raw[key]??'';if(typeof v!=='string'||v.length>max)throw Error('Invalid profile '+key);return v.trim();};
 const option=(key,allowed)=>{const v=text(key);if(!allowed.includes(v))throw Error('Invalid profile '+key);return v;};
 const number=(key,min,max,integer=false)=>{const v=raw[key];if(v==null||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))throw Error('Invalid profile '+key);return v;};
 const day=key=>{const v=text(key,10);if(v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v||v>new Date().toISOString().slice(0,10)))throw Error('Invalid profile date.');return v;};
 const p={version:1,displayName:text('displayName',80),handedness:option('handedness',['','right','left','ambidextrous']),age:number('age',0,120,true),ageAsOf:day('ageAsOf'),gender:option('gender',['','woman','man','nonbinary','self-described','prefer-not-to-say']),genderDescription:text('genderDescription',80),country:text('country',80),region:text('region',100),city:text('city',100),duprId:text('duprId',6).toUpperCase(),singlesRating:number('singlesRating',2,8),doublesRating:number('doublesRating',2,8),ratingsAsOf:day('ratingsAsOf'),ratingSource:'self-reported'};
 if(p.duprId&&!/^[A-Z0-9]{1,6}$/.test(p.duprId))throw Error('DUPR ID must contain up to six letters or numbers.');
 if(p.age!==null&&!p.ageAsOf)throw Error('Age needs a recorded date.');
 if((p.singlesRating!==null||p.doublesRating!==null)&&!p.ratingsAsOf)throw Error('Choose the date these ratings were current.');
 if(p.gender!=='self-described')p.genderDescription='';if(p.age===null)p.ageAsOf='';if(p.singlesRating===null&&p.doublesRating===null)p.ratingsAsOf='';
 return p;
}
