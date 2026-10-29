import {gameRecords,filterGameRecords,summarizeGames,groupGameRecords,playerHistory} from './results-data.js';
import {manualScoringSnapshot} from './manual-games.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function scoringSources(session){
 const sources=[];
 if(session.picklePointScoring)sources.push({...session,manualGames:null});
 if(session.manualGames?.games.length)sources.push({...session,picklePointScoring:null});
 return sources;
}
export function scoringDetailsMarkup(session,state,paddleName){return scoringSources(session).map(s=>scoringSourceMarkup(s,state,paddleName)).join('');}
function scoringSourceMarkup(session,state,paddleName){
 const manual=!!session.manualGames?.games.length,meta=session.picklePointScoring??(manual?{snapshot:manualScoringSnapshot(session)}:null);if(!meta)return '';const snapshot=meta.snapshot,players=new Map(snapshot.players.map(p=>[p.id,p])),owners=new Map(snapshot.owner.participation.map(p=>[p.gameId,p])),stale=!manual&&meta.usageRevision!==session.picklePoint.snapshot.revision;
 const name=id=>{const p=players.get(id);return esc(p?.displayName||'Unnamed player')+' <small>('+esc(p?.classification==='account-linked'?'Account linked':p?.classification==='saved'?'Saved player':'Guest')+')</small>';};
 const association=g=>{if(stale)return 'Paddle association awaiting refreshed scoring';const a=g.paddleAssociation;if(a.status==='single')return 'Paddle: '+esc(paddleName(state.paddles.find(p=>p.id===a.physicalPaddleIds[0])));if(a.status==='mixed')return 'Mixed paddle usage'+(a.coverage==='partial'?' · partial coverage':'');if(a.status==='none')return 'Spectating · no owner paddle result';return 'Paddle result unassigned'+(a.coverage==='partial'?' · partial recorded coverage':' · usage or game time unknown');};
 return '<details class="scoring-details"><summary>'+(manual?'PaddleLog games':'Pickle Point games')+' &amp; players · '+snapshot.matches.reduce((n,m)=>n+m.games.length,0)+' games</summary><p class="small">'+(manual?'Manually recorded in PaddleLog. Edit this session to correct games or players. Game results do not add paddle hours.':'Pickle Point scoring · revision '+snapshot.revision+' · Source scores and participants are read only here. Game clocks do not add paddle hours.')+'</p>'+snapshot.matches.map((m,i)=>'<section class="scoring-match"><h4>'+(manual?'Game ':'Match ')+(i+1)+' · '+esc(m.status)+(m.winnerTeam===null?'':' · Team '+(m.winnerTeam+1)+' won')+(m.wins?' · '+m.wins.join('–')+' games':'')+'</h4>'+(m.games.length?m.games.map(g=>{const owner=owners.get(g.id),score=g.finalScore??g.score;return '<article class="scoring-game"><div class="scoring-game-head"><b>'+esc(g.discipline)+' · '+esc(g.scoringFormat)+'</b><span class="badge">'+esc(g.status)+'</span></div><p class="scoring-score">'+(score?score.join(' – '):'Score unknown')+'</p><p>'+g.teams.map(t=>'Team '+(t.index+1)+': '+t.participantIds.map(name).join(' &amp; ')).join('<br>')+'</p><p class="small">'+(g.winnerTeam===null?'Winner unknown':'Team '+(g.winnerTeam+1)+' won')+' · Your participation: '+esc(owner.state)+'<br>'+association(g)+'<br>'+(g.timeBasis==='unknown'?'Game time unknown':esc(new Date(g.start).toLocaleString())+' → '+esc(new Date(g.end).toLocaleTimeString()))+'</p></article>';}).join(''):'<p class="small">No games remain in this source match.</p>')+'</section>').join('')+'</details>';
}
// Join saved players only inside the authenticated source library. Guests remain position/session scoped.
export function scoringAnalytics(state,paddleIds=null){
 const records=filterGameRecords(gameRecords(state),{paddleIds}),stats=summarizeGames(records);
 return {...stats,partners:playerHistory(records,'partner'),opponents:playerHistory(records,'opponent'),paddles:groupGameRecords(records,r=>r.paddleId).map(r=>({...r,label:r.key}))};
}
export function scoringAnalyticsMarkup(state,selected,paddleName){
 const all=selected.length===state.paddles.length,stats=scoringAnalytics(state,all?null:selected.map(p=>p.id));const rate=r=>r.knownResults?Math.round(100*r.wins/r.knownResults)+'% ('+r.wins+'/'+r.knownResults+')':'No known results';
 let html='<section class="card analytics-section"><h3>Game results · all time</h3><p class="small">Completed games with explicit participation from PaddleLog or Pickle Point. Unknown winners never count as losses. Manual game paddles are explicitly assigned by you. Imported paddle selections require complete recorded coverage by one paddle; mixed, partial and stale associations stay unassigned. These results describe your play, not a controlled paddle comparison.</p>';
 html+='<p><b>'+stats.played+' games played</b> · Win rate '+rate(stats)+'<br>Score differential '+stats.differential+' across '+stats.knownScores+' games with known final scores<br>'+stats.unknownResults+' unknown outcomes · '+stats.unattributed+' games without a single paddle result</p>';
 const rows=(title,data,label)=>'<details><summary>'+title+'</summary>'+(data.length?'<div class="comparison-scroll" tabindex="0" role="region" aria-label="'+title+'"><table><thead><tr><th scope="col">'+label+'</th><th scope="col">Games</th><th scope="col">Win rate</th><th scope="col">Differential</th></tr></thead><tbody>'+data.map(r=>'<tr><th scope="row">'+esc(title==='Results by paddle'?paddleName(state.paddles.find(p=>p.id===r.key)):r.label)+'</th><td>'+r.played+'</td><td>'+rate(r)+'</td><td>'+r.differential+' ('+r.knownScores+' scored)</td></tr>').join('')+'</tbody></table></div>':'<p class="small">No eligible results yet.</p>')+'</details>';
 html+=rows('With partners',stats.partners,'Partner')+rows('Against opponents',stats.opponents,'Opponent')+rows('Results by paddle',stats.paddles,'Paddle');return html+'</section>';
}

export function sessionResultsMarkup(session){
 const sources=scoringSources(session),count=sources.reduce((n,s)=>n+(s.picklePointScoring?.snapshot??manualScoringSnapshot(s)).matches.reduce((m,r)=>m+r.games.length,0),0);
 if(!count)return '';
 const stats=scoringAnalytics({sessions:[session]});
 return `<p class="session-results"><strong>${count} game${count===1?'':'s'}</strong>${stats.played?' · '+stats.wins+' wins · '+(stats.knownResults-stats.wins)+' losses'+(stats.unknownResults?' · '+stats.unknownResults+' unknown results':''):' · Your results not recorded'}</p>`;
}
