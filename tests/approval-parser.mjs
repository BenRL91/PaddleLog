import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'approval-parser-')),pages=path.join(dir,'usap');fs.mkdirSync(pages);
const body='Displaying 1 - 25 of 25'+Array.from({length:25},(_,i)=>`<div class="gv-layout-builder-view--entry gv-grid"><div class="gv-grid-value"><a href="https://equipment.usapickleball.org/paddle-list/entry/${i+1}">Fixture Brand</a></div><div class="gv-grid-value">Fixture ${i} 16mm</div><div class="gv-grid-value">10/01/2026</div>${i===0?'<span style="color: #d20000;">Fixture inspection restriction</span>':''}</div>`).join('');
fs.writeFileSync(path.join(pages,'1.html'),body);
const up=path.join(dir,'upa.html'),output=path.join(dir,'candidate.json');fs.writeFileSync(up,'<tr class="paddle-row">'+['','','Fixture Brand','Fixture Pro','FP16','16mm','Oct 01, 2026'].map(v=>`<td>${v}</td>`).join('')+'</tr>');
const run=()=>spawnSync('python',['scripts/import-official-approval-lists.py',pages,up,'--retrieved-at','2026-10-01','--output',output],{encoding:'utf8'});
try{
 const parsed=run();assert.equal(parsed.status,0,parsed.stderr);const candidate=JSON.parse(fs.readFileSync(output));assert.equal(candidate.records.length,26);assert.ok(candidate.records.every(a=>a.lastVerified==='2026-10-01'));assert.equal(candidate.records[0].status,'needsVerification');assert.equal(candidate.records.at(-1).certificationExpiryNeedsVerification,true);assert.equal(candidate.records.at(-1).expiresAt,undefined);
 const prior=fs.readFileSync(output,'utf8');fs.writeFileSync(path.join(pages,'1.html'),body.replace('entry/25','entry/24'));assert.notEqual(run().status,0);assert.equal(fs.readFileSync(output,'utf8'),prior);
 fs.writeFileSync(path.join(pages,'1.html'),body.replace('Displaying 1 - 25 of 25','Displaying 1 - 25 of 26'));assert.notEqual(run().status,0);assert.equal(fs.readFileSync(output,'utf8'),prior);
 console.log('PASS: parser retrieval date, annotated approvals, no invented expiration, duplicate-total failure, missing page failure, and unchanged output on failure.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
