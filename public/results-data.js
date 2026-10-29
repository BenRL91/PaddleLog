import {manualScoringSnapshot} from './manual-games.js';
// One adapter for source snapshots and locally entered games. Game clocks never add usage.
export function gameRecords(state){
 const records=[];
 for(const session of state.sessions??[]){
  const sources=[];if(session.picklePointScoring)sources.push({snapshot:session.picklePointScoring.snapshot,manual:false,stale:session.picklePointScoring.usageRevision!==session.picklePoint?.snapshot.revision});
  if(session.manualGames?.games.length)sources.push({snapshot:manualScoringSnapshot(session),manual:true,stale:false});
  for(const source of sources){const snap=source.snapshot,players=new Map(snap.players.map(p=>[p.id,p])),owners=new Map(snap.owner.participation.map(p=>[p.gameId,p]));
   for(const game of snap.matches.flatMap(m=>m.games)){
    const owner=owners.get(game.id),team=game.teams.find(t=>t.participantIds.includes(owner?.participantId));
    if(game.status!=='completed'||owner?.state!=='participating'||!team)continue;
    const a=game.paddleAssociation,paddleId=!source.stale&&a.status==='single'&&a.coverage==='complete'?a.physicalPaddleIds[0]:null;
    const association=paddleId?'single':!source.stale&&a.status==='mixed'?'mixed':'unknown';
    const score=game.finalScore,won=game.winnerTeam==null?null:game.winnerTeam===team.index,margin=score?score[team.index]-score[1-team.index]:null;
    const people=[];for(const t of game.teams)for(const id of t.participantIds){if(id===owner.participantId)continue;const p=players.get(id);if(!p)continue;const guest=p.classification==='guest';people.push({key:(source.manual?'paddlelog':session.picklePoint.sourceInstanceId)+'|'+(guest?snap.sessionId+'|':'')+p.sourcePlayerId,label:p.displayName||'Unnamed player',identity:guest?'Guest · this session':source.manual?'Saved in PaddleLog':'Saved in Pickle Point',role:t.index===team.index?'partner':'opponent'});}
    records.push({session,game,at:Date.parse(game.start??session.start),discipline:game.discipline,format:game.scoringFormat,won,margin,paddleId,association,paddleIds:source.stale?[]:a.physicalPaddleIds,people});
   }
  }
 }return records;
}
export function filterGameRecords(records,{start=-Infinity,end=Infinity,discipline='',format='',environment='',paddleIds=null,includeMixed=false}={}){
 return records.filter(r=>r.at>=start&&r.at<end&&(!discipline||r.discipline===discipline)&&(!format||r.format===format)&&(!environment||r.session.environment===environment)&&(!paddleIds||paddleIds.includes(r.paddleId)||includeMixed&&r.association==='mixed'&&r.paddleIds.some(id=>paddleIds.includes(id))));
}
export function summarizeGames(records){const out={played:records.length,knownResults:0,wins:0,losses:0,unknownResults:0,knownScores:0,differential:0,averageMargin:null,winRate:null,unattributed:0,mixed:0,unknownPaddle:0,winningMargins:[],losingMargins:[]};for(const r of records){if(r.won===null)out.unknownResults++;else{out.knownResults++;if(r.won)out.wins++;else out.losses++;}if(r.margin!==null){out.knownScores++;out.differential+=r.margin;if(r.won===true)out.winningMargins.push(r.margin);if(r.won===false)out.losingMargins.push(r.margin);}if(!r.paddleId)out.unattributed++;if(r.association==='mixed')out.mixed++;if(r.association==='unknown')out.unknownPaddle++;}out.winRate=out.knownResults?100*out.wins/out.knownResults:null;out.averageMargin=out.knownScores?out.differential/out.knownScores:null;return out;}
export function groupGameRecords(records,key){const groups=new Map();for(const r of records){const k=key(r);if(k==null)continue;const list=groups.get(k)??[];list.push(r);groups.set(k,list);}return [...groups].map(([key,rows])=>({key,rows,...summarizeGames(rows)}));}
export function playerHistory(records,role){const groups=new Map();for(const r of records)for(const p of r.people.filter(p=>p.role===role)){const group=groups.get(p.key)??{...p,rows:[]};if(!group.rows.includes(r))group.rows.push(r);groups.set(p.key,group);}return [...groups.values()].map(p=>({...p,...summarizeGames(p.rows)})).sort((a,b)=>b.played-a.played||a.label.localeCompare(b.label));}
