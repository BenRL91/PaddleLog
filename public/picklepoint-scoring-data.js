import {scoringSchema} from './picklepoint-scoring-schema.js';
const bad=message=>{throw new Error('Invalid Pickle Point scoring: '+message);};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
// Small, closed validator for the supplied schema vocabulary. Unknown keywords fail closed.
function check(value,s,path='snapshot'){
 if(s.anyOf){if(!s.anyOf.some(branch=>{try{check(value,branch,path);return true;}catch{return false;}}))bad(path);}
 if(s.allOf)for(const branch of s.allOf)check(value,branch,path);
 if(s.if){let matches=true;try{check(value,s.if,path);}catch{matches=false;}if(matches&&s.then)check(value,s.then,path);if(!matches&&s.else)check(value,s.else,path);}
 if(s.not){let matches=true;try{check(value,s.not,path);}catch{matches=false;}if(matches)bad(path);}
 if(s.type){const ok=s.type==='object'?object(value):s.type==='array'?Array.isArray(value):s.type==='null'?value===null:s.type==='integer'?Number.isSafeInteger(value):typeof value===s.type;if(!ok)bad(path+' type');}
 if(Object.hasOwn(s,'const')&&value!==s.const)bad(path+' value');if(s.enum&&!s.enum.includes(value))bad(path+' value');
 if(typeof value==='number'&&(value<(s.minimum??-Infinity)||value>(s.maximum??Infinity)))bad(path+' bounds');
 if(typeof value==='string'){if(value.length>(s.maxLength??Infinity)||s.pattern&&!new RegExp(s.pattern).test(value))bad(path+' text');if(s.format==='date-time'&&!date(value))bad(path+' date');if(s.format==='uuid'&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))bad(path+' UUID');}
 if(Array.isArray(value)){if(value.length<(s.minItems??0)||value.length>(s.maxItems??Infinity))bad(path+' length');if(s.items)value.forEach((v,i)=>check(v,s.items,path+'['+i+']'));}
 if(object(value)){if(s.required?.some(k=>!Object.hasOwn(value,k)))bad(path+' missing field');if(s.additionalProperties===false&&Object.keys(value).some(k=>!Object.hasOwn(s.properties??{},k)))bad(path+' unknown field');for(const [key,child] of Object.entries(s.properties??{}))if(Object.hasOwn(value,key))check(value[key],child,path+'.'+key);}
}
const unique=(rows,label)=>{const set=new Set();for(const row of rows){if(set.has(row.id))bad('duplicate '+label);set.add(row.id);}return set;};
export function normalizeScoringSnapshot(value){
 check(value,scoringSchema);const s=structuredClone(value),players=unique(s.players,'player'),matches=unique(s.matches,'match'),games=s.matches.flatMap(m=>m.games),gameIds=unique(games,'game');
 for(const p of s.players)if(p.id!==(p.classification==='guest'?'guest_':'saved_')+p.sourcePlayerId)bad('source player identity');if(games.length>2000)bad('too many games');const participation=new Map();for(const p of s.owner.participation){if(!gameIds.has(p.gameId)||participation.has(p.gameId))bad('owner game reference');participation.set(p.gameId,p);}if(participation.size!==games.length)bad('owner participation required per game');
 for(const m of s.matches){const wins=[0,0];let allKnown=true;for(const g of m.games){
  if(g.matchId!==m.id)bad('game match reference');if(g.teams[0].index!==0||g.teams[1].index!==1)bad('team indexes');const ids=g.teams.flatMap(t=>t.participantIds);if(new Set(ids).size!==ids.length||ids.some(id=>!players.has(id)))bad('team player reference');
  const simple=g.profileId==='simple-v1',discipline=simple?(g.teams.every(t=>t.participantIds.length===1)?'singles':g.teams.every(t=>t.participantIds.length===2)?'doubles':'unknown'):g.profileId.endsWith('-singles')?'singles':'doubles';
  const format=simple?'simple':g.profileId.includes('-side-out-')?'side-out':'rally';if(g.discipline!==discipline||g.scoringFormat!==format||!simple&&g.teams.some(t=>t.participantIds.length!==(discipline==='singles'?1:2)))bad('profile/team mismatch');
  const owner=participation.get(g.id);if(owner.state==='participating'&&!ids.includes(owner.participantId))bad('owner participant reference');
  if(g.timeBasis==='unknown'&&(g.start!==null||g.end!==null)||g.timeBasis==='elapsed-game'&&(!date(g.start)||!date(g.end)||Date.parse(g.end)<=Date.parse(g.start)))bad('game time bounds');
  if(g.status==='completed'){if(g.finalScore&&g.score&&(g.finalScore[0]!==g.score[0]||g.finalScore[1]!==g.score[1]))bad('final score differs');if(g.winnerTeam!==null){const score=g.finalScore;if(!score||score[g.winnerTeam]<g.target||score[g.winnerTeam]-score[1-g.winnerTeam]<g.winBy)bad('winner score');wins[g.winnerTeam]++;}else allKnown=false;}
  if(new Set(g.paddleAssociation.intervalIds).size!==g.paddleAssociation.intervalIds.length||new Set(g.paddleAssociation.physicalPaddleIds).size!==g.paddleAssociation.physicalPaddleIds.length)bad('duplicate association reference');
 }
 if(allKnown&&m.status==='open'&&wins.some(w=>w>=m.gamesRequired))bad('open match already won');if(m.wins&&(m.wins[0]!==wins[0]||m.wins[1]!==wins[1]))bad('match win counts');if(m.winnerTeam!==null&&(m.status!=='completed'||wins[m.winnerTeam]<m.gamesRequired||wins[m.winnerTeam]<=wins[1-m.winnerTeam]))bad('match winner');if(m.status==='open'&&m.winnerTeam!==null)bad('open match result');if(allKnown&&m.status==='completed'&&m.winnerTeam===null&&wins.some(w=>w>=m.gamesRequired))bad('missing established match winner');
 }
 return s;
}
export function derivePaddleAssociation(game,owner,intervals,refs){
 const unknown={status:'unknown',basis:'unknown',coverage:'unknown',intervalIds:[],physicalPaddleIds:[]};if(owner.state==='spectating')return {...unknown,status:'none'};if(owner.state!=='participating'||game.timeBasis!=='elapsed-game')return unknown;
 const start=Date.parse(game.start),end=Date.parse(game.end),hits=intervals.map(i=>({i,a:Math.max(start,Date.parse(i.start)),b:Math.min(end,Date.parse(i.end))})).filter(h=>h.b>h.a).sort((a,b)=>a.a-b.a||a.i.id.localeCompare(b.i.id));if(!hits.length)return unknown;
 let cursor=start,complete=true;for(const h of hits){if(h.a>cursor)complete=false;cursor=Math.max(cursor,h.b);}if(cursor<end)complete=false;
 const physicalPaddleIds=[...new Set(hits.map(h=>refs.get(h.i.id)))].sort(),intervalIds=hits.map(h=>h.i.id).sort();return {status:physicalPaddleIds.length>1?'mixed':complete?'single':'unknown',basis:'recorded-overlap',coverage:complete?'complete':'partial',intervalIds,physicalPaddleIds};
}
export function normalizeScoringMeta(meta){
 if(!object(meta)||Object.keys(meta).some(k=>!['snapshot','usageRevision'].includes(k))||!Number.isSafeInteger(meta.usageRevision)||meta.usageRevision<1)bad('stored scoring metadata');return {snapshot:normalizeScoringSnapshot(meta.snapshot),usageRevision:meta.usageRevision};
}
export function normalizeScoringReceipts(rows){
 if(!Array.isArray(rows)||rows.length>20000)bad('scoring receipts');const keys=new Set();return rows.map(r=>{if(!object(r)||Object.keys(r).length!==6||!['sourceInstanceId','sourceSessionId','sessionId','revision','usageRevision','digest'].every(k=>Object.hasOwn(r,k))||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(r.sourceInstanceId)||![r.sourceSessionId,r.sessionId].every(x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x))||![r.revision,r.usageRevision].every(x=>Number.isSafeInteger(x)&&x>0)||!/^[0-9a-f]{64}$/.test(r.digest))bad('scoring receipt');const key=r.sourceInstanceId+'|'+r.sourceSessionId;if(keys.has(key))bad('duplicate scoring receipt');keys.add(key);return {...r};});
}
