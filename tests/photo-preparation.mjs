import assert from 'node:assert/strict';
import {preparePhoto,MAX_PHOTO_BYTES} from '../public/photos.js';
// These tests deliberately provide no Image, canvas, or object URL implementation.
// The upload path must not decode pixels or allocate a canvas on the phone.
for(const [type,bytes] of [['image/jpeg',[255,216,255,224]],['image/png',[137,80,78,71,13,10,26,10]],['image/webp',[82,73,70,70,0,0,0,0,87,69,66,80]]]){
 const original=new Blob([new Uint8Array(bytes)],{type});assert.equal(await preparePhoto(original),original);
 const missingType=new Blob([new Uint8Array(bytes)]);const prepared=await preparePhoto(missingType);assert.equal(prepared.type,type);assert.deepEqual(await prepared.arrayBuffer(),await original.arrayBuffer());
}
await assert.rejects(preparePhoto(new Blob()),/Choose/);
await assert.rejects(preparePhoto(new Blob(['HEIC'])),/HEIC/);
let read=false;await assert.rejects(preparePhoto({size:MAX_PHOTO_BYTES+1,slice(){read=true;throw Error();}}),/under 6 MB/);assert.equal(read,false);
console.log('PASS: image uploads allocate no canvas/decoded pixels; originals preserved, MIME normalized, oversized/unsupported files rejected safely.');
