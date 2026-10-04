import assert from 'node:assert/strict';
import {mergeChanges,parseCatalog,mergeCatalog} from '../public/sync.js';
import {validate} from '../public/validate.js';
const blank=()=>validate({version:2,paddles:[],sessions:[],usagePeriods:[]});
const paddle=(id)=>({id,brand:'Test Brand',model:'Test Model',shape:'Hybrid',swingWeight:'117.25',status:'active'});
const base=validate({...blank(),paddles:[paddle('a')]});
const desired=structuredClone(base);desired.paddles[0].notes='my edit';
const remote=structuredClone(base);remote.paddles.push(paddle('b'));remote.paddles[0].shape='Elongated';
const merged=mergeChanges(base,desired,validate(remote));assert.equal(merged.paddles.length,2);assert.equal(merged.paddles[0].notes,'my edit');assert.equal(merged.paddles[0].shape,'Elongated');
remote.paddles[0].notes='other edit';assert.throws(()=>mergeChanges(base,desired,validate(remote)),/same field/);
const added=validate({...blank(),paddles:[paddle('c')]});assert.equal(mergeChanges(blank(),added,structuredClone(added)).paddles.length,1);
const c=parseCatalog('brand,model,shape\r\n"Example, Inc.","Model ""Pro""",Hybrid\r\n');assert.equal(c[0].model,'Model "Pro"');assert.equal(c[0].brand,'Example, Inc.');assert.equal(parseCatalog(JSON.stringify(c)).length,1);assert.equal(mergeCatalog(c,c).length,1);assert.throws(()=>parseCatalog('brand,model\nBrand,'));assert.throws(()=>parseCatalog('[{"brand":"X"}]'));assert.throws(()=>parseCatalog('brand,model\n"broken'));
assert.deepEqual(validate(JSON.parse(JSON.stringify({...base,catalog:c}))),{...base,catalog:c});assert.equal(validate(base).paddles[0].swingWeight,'117.25');
console.log('PASS: stale-tab merge, field conflicts, idempotent retry, decimal precision, Shape and catalog backup, CSV quoted commas/quotes, JSON, deduplication, malformed imports.');

const collection=validate({...base,paddles:[{...base.paddles[0],collectible:true,collectibleLabel:'Gold'}],settings:{...base.settings,mainPaddleId:'a',singlesMainPaddleId:'a',doublesMainPaddleId:'a',mixedMainPaddleId:'a',favoriteOrder:['a']}});assert.deepEqual(validate(JSON.parse(JSON.stringify(collection))),collection);
const left=structuredClone(base),right=structuredClone(base);left.settings.singlesMainPaddleId='a';right.settings.doublesMainPaddleId='a';const roles=validate(mergeChanges(base,left,right));assert.equal(roles.settings.singlesMainPaddleId,'a');assert.equal(roles.settings.doublesMainPaddleId,'a');const removed=mergeChanges(collection,{...collection,paddles:[]},collection);assert.equal(removed.settings.singlesMainPaddleId,null);assert.deepEqual(removed.settings.favoriteOrder,[]);assert.throws(()=>validate({...base,settings:{singlesMainPaddleId:'missing'}}));assert.throws(()=>validate({...base,paddles:[{...base.paddles[0],collectible:'yes'}]}));assert.throws(()=>validate({...base,settings:{favoriteOrder:['a','a']}}));
console.log('PASS: collection JSON roundtrip, role reference validation, independent role merge and deleted paddle cleanup.');

const equipmentBase=validate({...blank(),paddles:[paddle('shared')]});equipmentBase.paddles[0].maintenance=[];equipmentBase.paddles[0].configuration={weights:{base:{grams:220},items:[]}};
const localEquipment=structuredClone(equipmentBase),remoteEquipment=structuredClone(equipmentBase);
localEquipment.paddles[0].maintenance.push({id:'grip',kind:'overgrip'});remoteEquipment.paddles[0].maintenance.push({id:'tape',kind:'edgeTape'});
localEquipment.paddles[0].configuration.weights.items.push({id:'top',grams:3});remoteEquipment.paddles[0].configuration.weights.items.push({id:'butt',grams:5});
const equipmentMerged=mergeChanges(equipmentBase,localEquipment,remoteEquipment);assert.equal(equipmentMerged.paddles[0].maintenance.length,2);assert.equal(equipmentMerged.paddles[0].configuration.weights.items.length,2);
const conflictBase=structuredClone(equipmentMerged),conflictLocal=structuredClone(conflictBase),conflictRemote=structuredClone(conflictBase);conflictLocal.paddles[0].configuration.weights.items[0].grams=9;conflictRemote.paddles[0].configuration.weights.items[0].grams=10;assert.throws(()=>mergeChanges(conflictBase,conflictLocal,conflictRemote),/same field/);
console.log('PASS: independent consumable and weight item updates merge across devices; conflicting item measurements fail without overwriting.');
