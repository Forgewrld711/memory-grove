import { projectGrove } from "./projector.ts";
import type { ActorKind, GroveEvent, Id, IsoDateTime } from "./types.ts";

export type GroveEventInput = {
  id: Id;
  streamId: Id;
  type: GroveEvent["type"];
  actorId: Id;
  actorKind: ActorKind;
  occurredAt: IsoDateTime;
  payload: unknown;
};

export async function appendGroveEvent(
  existing: GroveEvent[],
  input: GroveEventInput,
): Promise<GroveEvent> {
  const last = existing.at(-1);
  if (last && last.streamId !== input.streamId) {
    throw new Error("Cannot append an event to a different stream");
  }

  const unsigned = {
    id: input.id,
    streamId: input.streamId,
    sequence: (last?.sequence ?? 0) + 1,
    type: input.type,
    actorId: input.actorId,
    actorKind: input.actorKind,
    occurredAt: input.occurredAt,
    previousHash: last?.eventHash ?? null,
    payload: input.payload,
  };
  const eventHash = await sha256Hex(canonicalJson(unsigned));
  const event = { ...unsigned, eventHash } as GroveEvent;

  // Projection is also our domain validator. Invalid ownership, link scope,
  // sequence, or consent transitions never reach durable storage.
  projectGrove([...existing, event]);
  return event;
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
