CREATE TABLE `leeway_identities` (
	`issuer` text NOT NULL,
	`subject` text NOT NULL,
	`account_id` text NOT NULL,
	PRIMARY KEY(`issuer`, `subject`)
);
--> statement-breakpoint
CREATE INDEX `leeway_identities_account_idx` ON `leeway_identities` (`account_id`);