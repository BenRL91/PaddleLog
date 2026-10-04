CREATE TABLE `health_counters` (
	`account_id` text NOT NULL,
	`day` text NOT NULL,
	`code` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`last_at` text NOT NULL,
	PRIMARY KEY(`account_id`, `day`, `code`)
);
