CREATE TABLE `feedback_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`screen` text NOT NULL,
	`steps` text NOT NULL,
	`version` text NOT NULL,
	`context` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution` text DEFAULT '' NOT NULL,
	`fixed_version` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_account_created_idx` ON `feedback_reports` (`account_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `feedback_status_created_idx` ON `feedback_reports` (`status`,`created_at`);