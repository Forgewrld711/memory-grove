import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * The immutable event ledger is the source of truth. Human Tree, Consent Grove,
 * and Agent Tree are projections and can be rebuilt from these rows.
 */
export const groveEvents = sqliteTable(
  "grove_events",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    streamId: text("stream_id").notNull(),
    sequence: integer("sequence").notNull(),
    eventType: text("event_type").notNull(),
    actorId: text("actor_id").notNull(),
    actorKind: text("actor_kind").notNull(),
    occurredAt: text("occurred_at").notNull(),
    previousHash: text("previous_hash"),
    eventHash: text("event_hash").notNull(),
    payloadJson: text("payload_json").notNull(),
    recordedAt: text("recorded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("grove_events_stream_sequence_unique").on(
      table.streamId,
      table.sequence,
    ),
    uniqueIndex("grove_events_stream_hash_unique").on(
      table.streamId,
      table.eventHash,
    ),
    index("grove_events_owner_stream_index").on(
      table.ownerUserId,
      table.streamId,
    ),
  ],
);

/** Immutable evidence objects referenced by one or more ledger events. */
export const groveEvidence = sqliteTable(
  "grove_evidence",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    sourceUri: text("source_uri").notNull(),
    sourceHash: text("source_hash").notNull(),
    modality: text("modality").notNull(),
    startMs: integer("start_ms"),
    endMs: integer("end_ms"),
    capturedAt: text("captured_at").notNull(),
    metadataJson: text("metadata_json").notNull().default("{}"),
  },
  (table) => [
    index("grove_evidence_owner_source_index").on(
      table.ownerUserId,
      table.sourceHash,
    ),
  ],
);
