CREATE TABLE `grove_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`stream_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`event_type` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_kind` text NOT NULL,
	`occurred_at` text NOT NULL,
	`previous_hash` text,
	`event_hash` text NOT NULL,
	`payload_json` text NOT NULL,
	`recorded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grove_events_stream_sequence_unique` ON `grove_events` (`stream_id`,`sequence`);--> statement-breakpoint
CREATE UNIQUE INDEX `grove_events_stream_hash_unique` ON `grove_events` (`stream_id`,`event_hash`);--> statement-breakpoint
CREATE INDEX `grove_events_owner_stream_index` ON `grove_events` (`owner_user_id`,`stream_id`);--> statement-breakpoint
CREATE TABLE `grove_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`source_uri` text NOT NULL,
	`source_hash` text NOT NULL,
	`modality` text NOT NULL,
	`start_ms` integer,
	`end_ms` integer,
	`captured_at` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `grove_evidence_owner_source_index` ON `grove_evidence` (`owner_user_id`,`source_hash`);