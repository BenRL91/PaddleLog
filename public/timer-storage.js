// Read authoritative timestamps; background intervals only refresh presentation.
export function checkedTimer(raw,accountId){
 if(!raw)return null;let t;try{t=JSON.parse(raw);}catch{throw Error('Device timer could not be read. Do not start another session; keep this browser’s data and contact support.');}
 const validId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x),time=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
 if(!t||t.accountId!==accountId||!validId(t.id)||!validId(t.paddleId)||!time(t.start)||t.end&&!time(t.end)||t.pausedAt&&!time(t.pausedAt))throw Error('Device timer is invalid. Keep this browser’s data and contact support.');
 const rows=t.segments??[{id:t.id+'-initial',paddleId:t.paddleId,start:t.start,...(t.end||t.pausedAt?{end:t.end??t.pausedAt}:{})}];if(!Array.isArray(rows)||rows.length>5000)throw Error('Invalid timer usage.');
 let last=Date.parse(t.start);const ids=new Set();for(const [i,s] of rows.entries()){if(!s||!validId(s.id)||ids.has(s.id)||!validId(s.paddleId)||!time(s.start)||Date.parse(s.start)<last||s.end&&(!time(s.end)||Date.parse(s.end)<=Date.parse(s.start))||!s.end&&(i!==rows.length-1||t.pausedAt||t.end))throw Error('Invalid timer usage. Keep this browser’s data and contact support.');ids.add(s.id);last=Date.parse(s.end??s.start);}
 if(t.end&&Date.parse(t.end)<last||t.pausedAt&&Date.parse(t.pausedAt)<last)throw Error('Timer clock is inconsistent.');return t;
}
export async function changeDeviceTimer(storage,key,owner,change,locks=globalThis.navigator?.locks){
 const run=()=>{const old=storage.getItem(key),current=checkedTimer(old,owner),next=change(current);if(next===undefined)return current;const raw=next===null?null:JSON.stringify(next);if(raw)checkedTimer(raw,owner);if(storage.getItem(key)!==old)throw Error('Timer changed in another tab. Review it and retry.');if(raw===null)storage.removeItem(key);else storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw Error('Could not preserve the timer on this device. Keep this page open and retry.');return next;};
 return locks?.request?locks.request(key,run):run();
}
