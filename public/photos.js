export const MAX_PHOTO_BYTES=6*1024*1024;
export function photoIdValid(id){return typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);}
export function photoType(bytes){if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return 'image/png';if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';return null;}
// Upload supported originals directly. Decoding a 48MP iPhone photo into Image +
// canvas can terminate Safari's web process before an exception can be caught.
export async function preparePhoto(file){
 if(!file||!file.size)throw new Error('Choose an image first.');
 if(file.size>MAX_PHOTO_BYTES)throw new Error('Choose an image under 6 MB. On iPhone, select a smaller image size in the photo picker, or use a screenshot. Your paddle draft is kept.');
 const type=photoType(new Uint8Array(await file.slice(0,12).arrayBuffer()));
 if(!type)throw new Error('Choose a JPEG, PNG or WebP image. For HEIC photos, use a screenshot or export as JPEG. Your paddle draft is kept.');
 return file.type===type?file:file.slice(0,file.size,type);
}
