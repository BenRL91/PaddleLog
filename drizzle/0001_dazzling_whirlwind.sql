CREATE TABLE `account_logs` (
	`account_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `account_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`object_key` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leeway_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`legacy_owner` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leeway_accounts_subject_unique` ON `leeway_accounts` (`subject`);--> statement-breakpoint
CREATE TABLE `entitlement_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`key` text NOT NULL,
	`source` text NOT NULL,
	`source_ref` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entitlement_grants_source_ref_unique` ON `entitlement_grants` (`source_ref`);