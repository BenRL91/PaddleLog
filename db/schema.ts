import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
export const logs=sqliteTable('paddle_logs',{id:integer('id').primaryKey(),payload:text('payload').notNull(),revision:integer('revision').notNull().default(0)});

export const accounts=sqliteTable('leeway_accounts',{id:text('id').primaryKey(),subject:text('subject').notNull().unique(),status:text('status').notNull().default('active'),legacyOwner:integer('legacy_owner').notNull().default(0)});
export const accountLogs=sqliteTable('account_logs',{accountId:text('account_id').primaryKey(),payload:text('payload').notNull(),revision:integer('revision').notNull().default(0)});
export const libraries=sqliteTable('account_libraries',{accountId:text('account_id').primaryKey(),metadata:text('metadata').notNull(),revision:integer('revision').notNull(),token:text('token').notNull(),updatedAt:text('updated_at').notNull()});
const recordColumns=()=>({accountId:text('account_id').notNull(),id:text('id').notNull(),paddleId:text('paddle_id'),position:integer('position').notNull(),payload:text('payload').notNull()});
export const paddles=sqliteTable('user_paddles',recordColumns(),t=>[primaryKey({columns:[t.accountId,t.id]})]);
export const sessions=sqliteTable('user_sessions',recordColumns(),t=>[primaryKey({columns:[t.accountId,t.id]}),index('user_sessions_paddle_idx').on(t.accountId,t.paddleId)]);
export const maintenance=sqliteTable('user_maintenance',recordColumns(),t=>[primaryKey({columns:[t.accountId,t.id]}),index('user_maintenance_paddle_idx').on(t.accountId,t.paddleId)]);
export const periods=sqliteTable('user_usage_periods',recordColumns(),t=>[primaryKey({columns:[t.accountId,t.id]})]);
export const catalog=sqliteTable('user_catalog',recordColumns(),t=>[primaryKey({columns:[t.accountId,t.id]})]);
export const accountPhotos=sqliteTable('account_photos',{id:text('id').primaryKey(),accountId:text('account_id').notNull(),objectKey:text('object_key').notNull()});
export const entitlements=sqliteTable('entitlement_grants',{id:text('id').primaryKey(),accountId:text('account_id').notNull(),key:text('key').notNull(),source:text('source').notNull(),sourceRef:text('source_ref').notNull().unique(),startsAt:integer('starts_at').notNull(),endsAt:integer('ends_at'),revokedAt:integer('revoked_at'),verifiedAt:integer('verified_at').notNull().default(0),metadata:text('metadata').notNull().default('{}')});

export const appMemberships=sqliteTable('app_memberships',{
 accountId:text('account_id').notNull(),
 appId:text('app_id').notNull(),
 role:text('role').notNull(),
 status:text('status').notNull().default('active'),
 createdAt:integer('created_at').notNull(),
 updatedAt:integer('updated_at').notNull()
},t=>[primaryKey({columns:[t.accountId,t.appId]}),index('app_memberships_app_status_idx').on(t.appId,t.status)]);

export const identities=sqliteTable('leeway_identities',{issuer:text('issuer').notNull(),subject:text('subject').notNull(),accountId:text('account_id').notNull()},t=>[primaryKey({columns:[t.issuer,t.subject]}),index('leeway_identities_account_idx').on(t.accountId)]);

export const healthCounters=sqliteTable('health_counters',{accountId:text('account_id').notNull(),day:text('day').notNull(),code:text('code').notNull(),count:integer('count').notNull().default(0),lastAt:text('last_at').notNull()},t=>[primaryKey({columns:[t.accountId,t.day,t.code]})]);

export const testerAccess=sqliteTable('tester_access',{id:text('id').primaryKey(),email:text('email').notNull().unique(),enabled:integer('enabled').notNull(),endsAt:integer('ends_at'),accountId:text('account_id'),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),updatedBy:text('updated_by').notNull()});
export const testerAudit=sqliteTable('tester_access_audit',{id:text('id').primaryKey(),actorId:text('actor_id').notNull(),email:text('email').notNull(),enabled:integer('enabled').notNull(),endsAt:integer('ends_at'),at:integer('at').notNull()});
