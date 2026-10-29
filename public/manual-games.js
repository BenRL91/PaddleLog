// Manual game results belong to PaddleLog. They never contribute usage minutes.
export function normalizeManualGames(value,session,paddleIds,playerIds=null){
 if(value==null)return null;
 if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['version','games'].includes(k))||value.version!==1||!Array.isArray(value.games)||value.games.length>200)throw Error('Invalid manual game records.');
 const seen=new Set();const games=value.games.map(g=>{
  if(!g||typeof g!=='object'||Object.keys(g).some(k=>!['id','discipline','format','status','target','winBy','teams','ownerTeam','score','paddleId','playerIds'].includes(k)))throw Error('Invalid game fields.');
  if(typeof g.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(g.id)||seen.has(g.id))throw Error('Invalid game identity.');seen.add(g.id);
  if(!['singles','doubles'].includes(g.discipline)||!['side-out','rally','simple'].includes(g.format)||!['completed','unfinished','abandoned'].includes(g.status))throw Error('Choose a game format and status.');
  if(!Number.isInteger(g.target)||g.target<1||g.target>1000||!Number.isInteger(g.winBy)||g.winBy<1||g.winBy>100)throw Error('Choose valid target and win-by scores.');
  const count=g.discipline==='singles'?1:2;
  if(!Array.isArray(g.teams)||g.teams.length!==2||g.teams.some(t=>!Array.isArray(t)||t.length!==count||t.some(n=>typeof n!=='string'||n.length>60||/@[^\s@]+\.[^\s@]+/.test(n))))throw Error('Use player names, not email addresses.');
  if(g.playerIds!=null&&(!Array.isArray(g.playerIds)||g.playerIds.length!==2||g.playerIds.some(t=>!Array.isArray(t)||t.length!==count||t.some(id=>id!==null&&(typeof id!=='string'||!/^\w[\w-]{0,99}$/.test(id)||playerIds&&!playerIds.has(id))))))throw Error('Choose a player from your saved library or enter a guest name.');
  if(g.playerIds){const ids=g.playerIds.flat().filter(Boolean);if(new Set(ids).size!==ids.length)throw Error('A saved player cannot occupy more than one place in a game.');}
  if(![0,1,null].includes(g.ownerTeam))throw Error('Choose your team or leave participation unknown.');
  if(g.score!==null&&(!Array.isArray(g.score)||g.score.length!==2||g.score.some(n=>!Number.isSafeInteger(n)||n<0||n>1000)))throw Error('Enter both scores as whole numbers from 0 to 1,000, or leave both blank.');
  if(g.paddleId!==null&&(!paddleIds.has(g.paddleId)||g.ownerTeam===null))throw Error('Choose one of your paddles and your team, or leave the game paddle unassigned.');
  if(g.paddleId&&session.paddleId&&!new Set(session.segments?.map(s=>s.paddleId)??[session.paddleId]).has(g.paddleId))throw Error('The game paddle must also appear in the session’s paddle usage.');
  if(g.status==='completed'&&g.score&&(Math.max(...g.score)<g.target||Math.abs(g.score[0]-g.score[1])<g.winBy))throw Error('A completed game must reach the target and win-by margin. Use unfinished for a partial score.');
  return {id:g.id,discipline:g.discipline,format:g.format,status:g.status,target:g.target,winBy:g.winBy,teams:g.teams.map(t=>t.map(n=>n.trim())),ownerTeam:g.ownerTeam,score:g.score?.slice()??null,paddleId:g.paddleId,...(g.playerIds?{playerIds:g.playerIds.map(t=>t.slice())}:{})};
 });return {version:1,games};
}
// Adapt manual results to the existing display/analytics shape, without source provenance.
export function manualScoringSnapshot(session){
 const players=[],participation=[],matches=[];
 for(const g of session.manualGames?.games??[]){
  const mid='match_'+g.id,teams=g.teams.map((names,index)=>({index,participantIds:names.map((displayName,i)=>{const saved=g.playerIds?.[index]?.[i],id='guest_'+g.id+'_'+index+'_'+i;players.push({id,sourcePlayerId:saved??id.slice(6),classification:saved?'saved':'guest',displayName:displayName||null,accountRef:null});return id;})}));
  participation.push({gameId:g.id,state:g.ownerTeam===null?'unknown':'participating',participantId:g.ownerTeam===null?null:teams[g.ownerTeam].participantIds[0]});
  const winner=g.status==='completed'&&g.score?(g.score[0]>g.score[1]?0:1):null;
  const game={id:g.id,matchId:mid,discipline:g.discipline,scoringFormat:g.format,status:g.status,teams,score:g.score,finalScore:g.status==='completed'?g.score:null,winnerTeam:winner,start:null,end:null,timeBasis:'unknown',paddleAssociation:{status:g.paddleId?'single':'unknown',basis:'manual-selection',coverage:g.paddleId?'complete':'unknown',intervalIds:[],physicalPaddleIds:g.paddleId?[g.paddleId]:[]}};
  matches.push({id:mid,status:g.status==='completed'?'completed':'open',winnerTeam:winner,wins:winner===null?null:winner===0?[1,0]:[0,1],games:[game]});
 }return {players,owner:{participation},matches,sessionId:session.id,revision:1};
}
