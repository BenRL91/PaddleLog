// Durable pending originals. No image bytes are put in localStorage.
async function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open('paddlelife-pending-photos',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function operation(mode,fn){const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('photos',mode);let result;const r=fn(tx.objectStore('photos'));r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
export const keepPhoto=(key,blob)=>operation('readwrite',s=>s.put(blob,key));
export const pendingPhoto=key=>operation('readonly',s=>s.get(key));
export const forgetPhoto=key=>operation('readwrite',s=>s.delete(key));
export async function clearAccountPhotos(account){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite');const r=tx.objectStore('photos').openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(String(c.key).startsWith(account+':'))c.delete();c.continue();}};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
