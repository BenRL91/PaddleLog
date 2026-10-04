// Provider-independent access; legacy grants remain valid without rewriting accounts.
const paddleLogKeys=new Set(['paddlelog_pro','paddlelife_pro']);
export function hasEntitlement(grants,key,now=Date.now()) {
 return grants.some(g=>(g.key===key||g.key==='leeway_all_access'||paddleLogKeys.has(key)&&paddleLogKeys.has(g.key))&&g.revokedAt==null&&Number.isFinite(g.startsAt)&&g.startsAt<=now&&(g.endsAt==null||g.endsAt>now));
}
export const hasPaddleLogPro=(grants,now)=>hasEntitlement(grants,'paddlelog_pro',now);
export const hasPaddleLifePro=hasPaddleLogPro; // Compatibility for existing clients.
