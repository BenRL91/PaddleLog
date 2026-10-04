import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate} from '../public/validate.js';
const before={version:2,paddles:[{id:'one',brand:'Test',model:'Test',staticWeight:8.7,configuration:{modifications:[],tuningLab:{schemaVersion:1,model:"Legacy",imageId:'8e1ff6d0-f554-4c6b-90a4-601ccf46d12e',reviewedAt:'2026-10-03T12:00:00Z',estimates:{staticWeight:9.74},modifications:[]}}}],sessions:[],usagePeriods:[]};
const round=validate(JSON.parse(JSON.stringify(validate(before))));assert.equal(round.paddles[0].staticWeight,8.7);assert.equal(round.paddles[0].configuration.tuningLab.estimates.staticWeight,9.74);
const html=fs.readFileSync('app/paddle.html','utf8');assert.doesNotMatch(html,/scanTuning|tuningFile|tune.pickleballeffect.com/);
assert(!fs.existsSync('public/tuning-ocr.js'));assert(!fs.existsSync('public/tuning-import-ui.js'));assert(!fs.existsSync('public/ocr'));
console.log('PASS: import UI/OCR removed; legacy backup and user measurements preserved.');
