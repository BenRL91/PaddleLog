import {validate} from './validate.js';
import {MAX_PHOTO_BYTES,photoType,photoIdValid} from './photos.js';

export const BACKUP_FORMAT='paddlelog.backup.v1';
export const MAX_BACKUP_BYTES=32*1024*1024;
export const MAX_BACKUP_PHOTOS_BYTES=20*1024*1024;
const MAX_RECORD_BYTES=2000000;
const bytesLength=value=>new TextEncoder().encode(JSON.stringify(value)).length;
const slots=state=>[
 ...state.paddles.flatMap(p=>['photoId','tuningImageId'].map(key=>[p,key])),
 ...state.sessions.flatMap(s=>['photoId','beforePhotoId','afterPhotoId'].map(key=>[s,key])),
];
export const backupPhotoIds=state=>[...new Set(slots(state).map(([r,k])=>r[k]).filter(Boolean))];
function records(raw){
 if(bytesLength(raw)>MAX_RECORD_BYTES)throw Error('Records exceed the current 2 MB library limit.');
 const clean=validate(raw);if(bytesLength(clean)>MAX_RECORD_BYTES-10000)throw Error('Restored records exceed the current library size limit.');return clean;
}
function encode(bytes){let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(value);}
function decode(value){
 if(typeof value!=='string'||value.length>Math.ceil(MAX_PHOTO_BYTES/3)*4||value.length%4!==0||/[^A-Za-z0-9+/=]/.test(value))throw Error('Invalid photo data in backup.');
 const raw=atob(value);if(btoa(raw)!==value)throw Error('Invalid photo encoding.');return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
async function digest(bytes){const value=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(value)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function validImage(bytes,type){if(!bytes.length||bytes.length>MAX_PHOTO_BYTES||!photoType(bytes)||photoType(bytes)!==type)throw Error('Unsupported or damaged backup photo.');}

// Read only confirmed account records. A failed photo download never yields a partial backup.
export async function buildPortableBackup(raw,readPhoto,onProgress=()=>{}){
 const state=records(raw),ids=backupPhotoIds(state),photos=[];let total=0;
 for(const id of ids){
  onProgress(`Preparing Photo ${photos.length+1} Of ${ids.length}…`);
  const file=await readPhoto(id);
  if(file.size>MAX_PHOTO_BYTES)throw Error('A photo exceeds the supported 6 MB image size.');
  total+=file.size;if(total>MAX_BACKUP_PHOTOS_BYTES)throw Error('Photos exceed the 20 MB portable-backup limit. Use records-only export and download your photos separately.');
  const bytes=new Uint8Array(await file.arrayBuffer()),type=photoType(bytes);validImage(bytes,type);
  photos.push({id,type,sha256:await digest(bytes),data:encode(bytes)});
 }
 const backup={backupFormat:BACKUP_FORMAT,exportedAt:new Date().toISOString(),state,photos};
 if(bytesLength(backup)>MAX_BACKUP_BYTES)throw Error('Backup exceeds the 32 MB file limit.');
 return backup;
}

// Validate the entire file, reference set, signatures, and hashes before any upload/write.
export async function parseBackup(raw){
 if(!raw||typeof raw!=='object')throw Error('Choose a PaddleLog backup.');
 if(raw.backupFormat==null)return {state:records(raw),photos:[],portable:false};
 if(raw.backupFormat!==BACKUP_FORMAT)throw Error('Unsupported backup version.');
 if(bytesLength(raw)>MAX_BACKUP_BYTES)throw Error('Backup exceeds the 32 MB file limit.');
 const state=records(raw.state),needed=new Set(backupPhotoIds(state));
 if(!Array.isArray(raw.photos)||raw.photos.length!==needed.size)throw Error('Backup is missing photos or includes unexpected photos.');
 let total=0;const seen=new Set();
 for(const photo of raw.photos){
  if(!photo||!photoIdValid(photo.id)||!needed.has(photo.id)||seen.has(photo.id))throw Error('Invalid or duplicate backup photo reference.');
  seen.add(photo.id);const bytes=decode(photo.data);total+=bytes.length;
  if(total>MAX_BACKUP_PHOTOS_BYTES)throw Error('Backup photos exceed 20 MB.');
  validImage(bytes,photo.type);
  if(typeof photo.sha256!=='string'||await digest(bytes)!==photo.sha256)throw Error('A backup photo failed its integrity check.');
 }
 return {state,photos:raw.photos,portable:true};
}

// Uploaded IDs always belong to the signed-in destination account. No source-account IDs
// are trusted for portability. The caller atomically saves this result only after all uploads.
export async function restoreBackupPhotos(parsed,uploadPhoto,onProgress=()=>{}){
 const state=structuredClone(parsed.state),mapping=new Map();
 for(const photo of parsed.photos){
  onProgress(`Restoring Photo ${mapping.size+1} Of ${parsed.photos.length}…`);
  const id=await uploadPhoto(new Blob([decode(photo.data)],{type:photo.type}));
  if(!photoIdValid(id)||[...mapping.values()].includes(id))throw Error('Photo restoration was not confirmed.');
  mapping.set(photo.id,id);
 }
 for(const [record,key] of slots(state))if(mapping.has(record[key]))record[key]=mapping.get(record[key]);
 return validate(state);
}
