import assert from 'node:assert/strict';
import {shapeCategory,paddleShapeCategory,paddleShapeMatches,numericTier,coreCategory} from '../public/paddle-categories.js';
import {paddleFilterValues} from '../public/paddle-filters.js';
for(const shape of ['Wide','widebody','Wide Body','Standard','Traditional','Square','AeroStandardSquare'])assert.equal(shapeCategory(shape),'Widebody');
assert.equal(shapeCategory('Elongated+'),'Elongated');assert.equal(shapeCategory('AeroHybridPlus'),'Hybrid');
const p={brand:'Brand',model:'Model',modelId:'id',shape:'Wide',thickness:16};
const row={brand:'Brand',model:'Model',referenceModelId:'id',shape:'Radius',thickness:16,reference:{kind:'manufacturer'},referenceRecord:{specs:{length:16.5,width:7.5}}};
assert.equal(paddleShapeCategory(p,[row]),'Elongated');assert.equal(p.shape,'Wide');
row.referenceRecord.specs={length:16.3,width:7.8};assert.equal(paddleShapeCategory(p,[row]),'Hybrid');
row.referenceRecord.specs={length:16,width:8};assert.equal(paddleShapeCategory({...p,shape:''},[row]),'Widebody');
row.referenceRecord.specMetadata={pendingVerificationFields:['width']};assert.equal(paddleShapeCategory({...p,shape:''},[row]),'Other / custom');
assert.equal(paddleShapeCategory({brand:'Unknown',model:'X',shape:'Radius'},[]),'Other / custom');
assert.equal(paddleShapeCategory({brand:'Unknown',model:'X'},[]),'Not recorded');
assert.equal(paddleFilterValues({brand:'Honolulu Pickleball Company'},[]).brand,'Honolulu');
console.log('PASS: shape aliases, manufacturer precedence, pending specs, unknowns and compact brands.');

assert.equal(numericTier('',113,121),'Not recorded');assert.equal(numericTier(120.5,113,121),'Medium');assert.equal(numericTier(121,113,121),'High');assert.equal(coreCategory({thickness:14},[]),'Thin (≤14 mm)');assert.equal(coreCategory({thickness:15},[]),'Medium (>14–<16 mm)');assert.equal(coreCategory({thickness:16},[]),'Thick (≥16 mm)');

const h={brand:'Custom',model:'H',shape:'Hylongated'};assert.equal(paddleShapeCategory(h,[]),'Hybrid');assert.deepEqual(paddleShapeMatches(h,[]),['Hybrid','Elongated']);assert.deepEqual(paddleShapeMatches({...h,shape:'Hybrid'},[]),['Hybrid']);
