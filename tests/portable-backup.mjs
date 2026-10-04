import assert from 'node:assert/strict';
import {buildPortableBackup,parseBackup,restoreBackupPhotos,backupPhotoIds,BACKUP_FORMAT} from '../public/portable-backup.js';
import {hasEntitlement,hasPaddleLogPro} from '../public/entitlements.js';
import {billingConfig,proBenefits} from '../public/billing-config.js';
import {featureAccess} from '../public/feature-policy.js';
const id=crypto.randomUUID(),id2=crypto.randomUUID();
const original={version:2,paddles:[{id:'p',brand:'Test',model:'Unit',photoId:id,tuningImageId:id2,staticWeight:8.34}],sessions:[{id:'s',paddleId:'p',start:'2026-10-02T12:00:00Z',end:'2026-10-02T13:00:00Z',photoId:id,beforePhotoId:id2}],usagePeriods:[],catalog:[]};
const before=JSON.stringify(original),image=new Blob([new Uint8Array([255,216,255,224,0,0])],{type:'image/jpeg'});let downloads=0;
const exported=await buildPortableBackup(original,async()=>{downloads++;return image;});
assert.equal(downloads,2);assert.equal(exported.backupFormat,BACKUP_FORMAT);assert.equal(JSON.stringify(original),before);
const parsed=await parseBackup(JSON.parse(JSON.stringify(exported)));assert.equal(parsed.photos.length,2);
const newIds=[crypto.randomUUID(),crypto.randomUUID()];let uploads=0;const restored=await restoreBackupPhotos(parsed,async file=>{assert.equal(file.type,'image/jpeg');assert.deepEqual(new Uint8Array(await file.arrayBuffer()),new Uint8Array(await image.arrayBuffer()));return newIds[uploads++];});
assert.equal(restored.paddles[0].photoId,restored.sessions[0].photoId);assert.equal(restored.sessions[0].beforePhotoId,newIds[1]);assert.equal(restored.paddles[0].staticWeight,8.34);assert.deepEqual(backupPhotoIds(restored),newIds);assert.equal(parsed.state.paddles[0].photoId,id);
assert.equal((await parseBackup(original)).portable,false);
for(const mutate of [x=>x.photos.pop(),x=>x.photos.push(x.photos[0]),x=>x.photos[1].id=x.photos[0].id,x=>x.photos[0].sha256='bad',x=>x.photos[0].data='bad!',x=>x.photos[0].type='image/png',x=>x.backupFormat='future',x=>x.state.sessions[0].paddleId='missing']){const bad=structuredClone(exported);mutate(bad);await assert.rejects(parseBackup(bad));}
await assert.rejects(buildPortableBackup(original,async()=>{throw Error('Download failed');}));
await assert.rejects(restoreBackupPhotos(parsed,async()=>{throw Error('Upload failed');}));assert.equal(JSON.stringify(original),before);
await assert.rejects(buildPortableBackup(original,async()=>({size:7*1024*1024})),/6 MB/);
const empty=await buildPortableBackup({paddles:[],sessions:[],usagePeriods:[],catalog:[]},async()=>assert.fail());assert.equal(empty.photos.length,0);
// Legacy, current, and ecosystem grants all retain expiration and product boundaries.
for(const key of ['paddlelife_pro','paddlelog_pro','leeway_all_access']){const grant={key,startsAt:0,endsAt:2000};assert.ok(hasPaddleLogPro([grant],1000));assert.ok(hasEntitlement([grant],'paddlelog_pro',1000));assert.equal(hasPaddleLogPro([grant],2000),false);}
assert.equal(hasPaddleLogPro([{key:'coach_pro',startsAt:0,endsAt:null}],1000),false);
assert.equal(featureAccess('dataExport',[]).allowed,true);assert.equal(featureAccess('comparisons',[]).allowed,false);
assert.ok(proBenefits.every(x=>billingConfig.features[x.feature]&&!billingConfig.freeFeatures.includes(x.feature)));
assert.equal(billingConfig.purchasesEnabled,false);assert.equal(billingConfig.products.annual.id,'paddlelog.pro.annual');
console.log('PASS: portable photos, deduplication, checksums, missing/malformed/oversized media, old JSON, upload/download failure, physical measurements, new-owner ID mapping, Free backups, legacy Pro compatibility, and disabled purchases.');

const largeBytes=new Uint8Array(6*1024*1024);largeBytes.set([255,216,255]);const largeBlob=new Blob([largeBytes],{type:'image/jpeg'});
await assert.rejects(buildPortableBackup({paddles:[1,2,3,4].map(n=>({id:'p'+n,brand:'A',model:'B',photoId:crypto.randomUUID()})),sessions:[],usagePeriods:[],catalog:[]},async()=>largeBlob),/20 MB/);
