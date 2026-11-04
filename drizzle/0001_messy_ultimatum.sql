CREATE TABLE `muse_usage` (
	`subject_hash` text NOT NULL,
	`bucket_start` text NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`subject_hash`, `bucket_start`)
);
