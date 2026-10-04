// Only trusted provider responses enter this path. Client/self-reported data is separate.
const date=value=>{const n=Date.parse(value);if(!Number.isFinite(n))throw new Error('Invalid rating timestamp');return n;};
const rating=value=>{if(value==null||value==='NR')return null;if(typeof value!=='number'||!Number.isFinite(value)||value<2||value>8)throw new Error('Invalid DUPR rating');return value;};
export function ratingSnapshot(connection,player,at=new Date().toISOString()){
 if(connection?.status!=='verified'||!connection.accountId||connection.duprId!==player?.duprId)throw new Error('Verified identity required');
 date(at);
 return {id:crypto.randomUUID(),accountId:connection.accountId,provider:'dupr',providerPlayerId:player.duprId,source:'provider',observedAt:at,effectiveAt:at,effectiveBasis:'observation',singles:rating(player.singlesRating),doubles:rating(player.doublesRating),singlesProvisional:typeof player.singlesProvisional==='boolean'?player.singlesProvisional:null,doublesProvisional:typeof player.doublesProvisional==='boolean'?player.doublesProvisional:null};
}
export function ratingAt(snapshots,accountId,sessionAt,discipline,{maxAgeDays=30}={}){
 if(!['singles','doubles'].includes(discipline))return null;
 const time=date(sessionAt);
 const match=snapshots.filter(s=>s.accountId===accountId&&s.source==='provider'&&s.provider==='dupr'&&date(s.effectiveAt)<=time&&date(s.observedAt)<=time).sort((a,b)=>date(b.effectiveAt)-date(a.effectiveAt))[0];
 if(!match||time-date(match.observedAt)>maxAgeDays*86400000||match[discipline]==null)return null;
 return {snapshotId:match.id,value:match[discipline],provisional:match[discipline+'Provisional'],observedAt:match.observedAt};
}
export function analyticsPermission({consent,providerRights,now=Date.now()}){
 return !!(consent?.granted===true&&consent.purpose==='manufacturer_aggregate_research'&&consent.version&&Date.parse(consent.at)<=now&&!consent.revokedAt&&providerRights?.commercialAggregateUse===true&&providerRights.agreementReference&&Date.parse(providerRights.expiresAt)>now);
}
// Deliberately no public reporting endpoint. This is the admission gate for future reports.
export function cohortReady(records,{minimumPlayers=20}={}){
 if(!Number.isInteger(minimumPlayers)||minimumPlayers<20)throw new Error('Minimum cohort is 20 players');
 const eligible=records.filter(r=>r.allowed===true&&r.rating?.provisional===false&&Number.isFinite(r.rating.value)&&typeof r.accountId==='string'&&r.accountId);
 const players=new Set(eligible.map(r=>r.accountId));
 return {publishable:players.size>=minimumPlayers,playerCount:players.size,minimumPlayers};
}
