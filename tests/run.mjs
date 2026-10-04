import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const timeoutMs=120_000;
for(const file of readdirSync('tests').filter(x=>x.endsWith('.mjs')&&x!=='run.mjs').sort()){
 console.log(`RUN: ${file}`);
 const result=spawnSync(process.execPath,['tests/'+file],{stdio:'inherit',timeout:timeoutMs});
 if(result.error?.code==='ETIMEDOUT'){
  console.error(`TIMEOUT: ${file} exceeded ${timeoutMs/1000}s`);
  process.exit(124);
 }
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
