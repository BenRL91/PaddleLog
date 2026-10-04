CREATE TABLE `tester_access` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`enabled` integer NOT NULL,
	`ends_at` integer,
	`account_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tester_access_email_unique` ON `tester_access` (`email`);--> statement-breakpoint
CREATE TABLE `tester_access_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`email` text NOT NULL,
	`enabled` integer NOT NULL,
	`ends_at` integer,
	`at` integer NOT NULL
);
--> statement-breakpoint
-- Explicit owner-authorized pending test grant; no account creation or identity merge.
INSERT OR IGNORE INTO tester_access (id,email,enabled,ends_at,account_id,created_at,updated_at,updated_by)
VALUES ('example-tester-seed','tester@example.invalid',1,NULL,NULL,1791072000000,1791072000000,'00000000-0000-4000-8000-000000000001');
