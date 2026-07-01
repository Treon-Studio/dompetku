CREATE TABLE `payment_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_name` text NOT NULL,
	`account_number` text NOT NULL,
	`account_holder` text NOT NULL,
	`qris_image` text,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
