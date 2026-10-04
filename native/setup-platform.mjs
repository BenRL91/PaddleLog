import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const platform=process.argv[2];
if(!['ios','android'].includes(platform))throw new Error('Choose ios or android');
const appId=process.env.PADDLELOG_APP_ID||process.env.PADDLELIFE_APP_ID;
if(!appId)throw new Error('Set PADDLELOG_APP_ID to your registered bundle ID / Android package name first.');
const cwd=new URL('.',import.meta.url);
for(const args of [...(!existsSync(new URL(platform+'/',cwd))?[['exec','cap','add',platform]]:[]),['exec','cap','sync',platform]]){
 const result=spawnSync('pnpm',args,{cwd,stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);
}
