/** Trust boundary: official approvals and service attestations come from the
 * administrator-controlled backend, never from the user's imported paddle JSON. */
export type MeasurementOrigin='manufacturer_reference'|'user'|'paddlelog_verified';
export interface MeasurementRecord {id:string;paddleId:string;at:string;configurationKey:string;origin:MeasurementOrigin;values:Record<string,number>;units:Record<string,string>;sourceUrl?:string;verifiedBy?:string}
export interface PhysicalModification {id:string;kind:'addedWeight'|'grip'|'surfaceCondition'|'other'|string;label:string;material?:string;location?:string;grams?:number;notes?:string}
export interface ApprovalRecord {organization:string;modelKey:string;manufacturer:string;model:string;modelNumber?:string;certification?:string;status:'approved'|'notApproved'|'expired'|'delisted';effectiveAt?:string;expiresAt?:string;revokedAt?:string;lastVerified:string;sourceUrl:string}
export interface ConfigurationApproval {modelKey:string;manufacturer:string;product:string;variant:string;rulesetId:string;rulesetVersion:string;status:'approved'|'prohibited';effectiveAt?:string;endsAt?:string;expiresAt?:string;revokedAt?:string;lastVerified:string;sourceUrl:string}
export interface MaintenanceEvent {id:string;kind:string;action:'install'|'remove';at:string;manufacturer:string;product:string;variant:string;interval:number|null;notes:string}
export interface RuleMetadata {id:string;type:string;summary:string;sourceUrl:string;lastVerified:string;effectiveAt?:string;endsAt?:string;supersededBy?:string}
// Physical paddle usage is independent of a game/workout's scoring semantics.
// Segment IDs are stable integration anchors; intervals are half-open UTC times.
export interface PaddleUsageSegment {id:string;paddleId:string;start:string;end:string}
export interface UsageSession {id:string;paddleId:string;start:string;end:string;segments?:PaddleUsageSegment[];notes:string}
