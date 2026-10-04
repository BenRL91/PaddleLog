ALTER TABLE `entitlement_grants` ADD `verified_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `entitlement_grants` ADD `metadata` text DEFAULT '{}' NOT NULL;