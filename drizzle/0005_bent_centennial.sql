CREATE TABLE `user_catalog` (
	`account_id` text NOT NULL,
	`id` text NOT NULL,
	`paddle_id` text,
	`position` integer NOT NULL,
	`payload` text NOT NULL,
	PRIMARY KEY(`account_id`, `id`)
);
--> statement-breakpoint
CREATE TABLE `account_libraries` (
	`account_id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`revision` integer NOT NULL,
	`token` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_maintenance` (
	`account_id` text NOT NULL,
	`id` text NOT NULL,
	`paddle_id` text,
	`position` integer NOT NULL,
	`payload` text NOT NULL,
	PRIMARY KEY(`account_id`, `id`)
);
--> statement-breakpoint
CREATE INDEX `user_maintenance_paddle_idx` ON `user_maintenance` (`account_id`,`paddle_id`);--> statement-breakpoint
CREATE TABLE `user_paddles` (
	`account_id` text NOT NULL,
	`id` text NOT NULL,
	`paddle_id` text,
	`position` integer NOT NULL,
	`payload` text NOT NULL,
	PRIMARY KEY(`account_id`, `id`)
);
--> statement-breakpoint
CREATE TABLE `user_usage_periods` (
	`account_id` text NOT NULL,
	`id` text NOT NULL,
	`paddle_id` text,
	`position` integer NOT NULL,
	`payload` text NOT NULL,
	PRIMARY KEY(`account_id`, `id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`account_id` text NOT NULL,
	`id` text NOT NULL,
	`paddle_id` text,
	`position` integer NOT NULL,
	`payload` text NOT NULL,
	PRIMARY KEY(`account_id`, `id`)
);
--> statement-breakpoint
CREATE INDEX `user_sessions_paddle_idx` ON `user_sessions` (`account_id`,`paddle_id`);