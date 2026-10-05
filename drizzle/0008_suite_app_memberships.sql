CREATE TABLE `app_memberships` (
  `account_id` text NOT NULL,
  `app_id` text NOT NULL,
  `role` text NOT NULL,
  `status` text NOT NULL DEFAULT 'active',
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY(`account_id`, `app_id`)
);
--> statement-breakpoint
CREATE INDEX `app_memberships_app_status_idx` ON `app_memberships` (`app_id`, `status`);
--> statement-breakpoint
INSERT OR IGNORE INTO `app_memberships` (`account_id`,`app_id`,`role`,`status`,`created_at`,`updated_at`)
SELECT `id`,'paddlelog','member','active',CAST(strftime('%s','now') AS integer)*1000,CAST(strftime('%s','now') AS integer)*1000
FROM `leeway_accounts`
WHERE `status`='active';
