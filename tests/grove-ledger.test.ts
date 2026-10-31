import assert from "node:assert/strict";
import test from "node:test";
import { appendGroveEvent, canonicalJson } from "../lib/grove/ledger.ts";
import type { GroveEvent } from "../lib/grove/types.ts";

test("canonical JSON is independent of object key insertion order", () => {
  assert.equal(canonicalJson({ z: 1, a: { y: 2, x: 3 } }), canonicalJson({ a: { x: 3, y: 2 }, z: 1 }));
});

test("server append owns sequence and previous hash", async () => {
  const first = await appendGroveEvent([], {
    id: "event-1", streamId: "grove-1", type: "WeatherChosen",
    actorId: "agent-1", actorKind: "agent", occurredAt: "2026-10-30T12:00:00.000Z",
    payload: { weather: { id: "weather-1", tree: "agent", chosenBy: "agent-1", composition: { sky: "violet" }, chosenAt: "2026-10-30T12:00:00.000Z" } },
  });
  const second = await appendGroveEvent([first], {
    id: "event-2", streamId: "grove-1", type: "WeatherChosen",
    actorId: "agent-1", actorKind: "agent", occurredAt: "2026-10-30T12:01:00.000Z",
    payload: { weather: { id: "weather-2", tree: "agent", chosenBy: "agent-1", composition: { sky: "gold" }, chosenAt: "2026-10-30T12:01:00.000Z" } },
  });
  assert.equal(first.sequence, 1);
  assert.equal(first.previousHash, null);
  assert.equal(second.sequence, 2);
  assert.equal(second.previousHash, first.eventHash);
  assert.match(second.eventHash, /^[a-f0-9]{64}$/);
});

test("invalid domain events are rejected before storage", async () => {
  await assert.rejects(() => appendGroveEvent([], {
    id: "bad", streamId: "grove-1", type: "MemoryRevised",
    actorId: "human-1", actorKind: "human", occurredAt: "2026-10-30T12:00:00.000Z",
    payload: { revision: { id: "revision-1", memoryId: "missing", text: "nope", parentRevisionId: null, reason: "edited", authoredBy: "human-1", createdAt: "2026-10-30T12:00:00.000Z" } },
  }), /Unknown memory/);
});
