import assert from "node:assert/strict";
import test from "node:test";

import { projectGrove } from "../lib/grove/projector.ts";
import type {
  ConsentLink,
  GroveEvent,
  Memory,
  MemoryRevision,
} from "../lib/grove/types.ts";

const at = "2026-10-29T12:00:00.000Z";

const humanMemory: Memory = {
  id: "memory-human",
  tree: "human",
  authorId: "miranda",
  currentRevisionId: "revision-human-1",
  syntheticFixture: true,
  visibility: "linkable",
  status: "active",
  evidenceIds: ["evidence-video"],
  createdAt: at,
};

const agentMemory: Memory = {
  ...humanMemory,
  id: "memory-agent",
  tree: "agent",
  authorId: "muse",
  currentRevisionId: "revision-agent-1",
};

function revision(
  id: string,
  memoryId: string,
  text: string,
): MemoryRevision {
  return {
    id,
    memoryId,
    text,
    parentRevisionId: null,
    reason: "created",
    authoredBy: memoryId === "memory-human" ? "miranda" : "muse",
    createdAt: at,
  };
}

function envelope(
  sequence: number,
  previousHash: string | null,
  event: Omit<
    GroveEvent,
    | "id"
    | "streamId"
    | "sequence"
    | "actorId"
    | "actorKind"
    | "occurredAt"
    | "previousHash"
    | "eventHash"
  >,
): GroveEvent {
  return {
    id: `event-${sequence}`,
    streamId: "grove-demo",
    sequence,
    actorId: sequence % 2 ? "miranda" : "muse",
    actorKind: sequence % 2 ? "human" : "agent",
    occurredAt: at,
    previousHash,
    eventHash: `hash-${sequence}`,
    ...event,
  } as GroveEvent;
}

test("projects bilateral consent without moving either authored memory", () => {
  const link: ConsentLink = {
    id: "link-1",
    humanMemoryId: humanMemory.id,
    agentMemoryId: agentMemory.id,
    evidenceIds: ["evidence-video"],
    proposedBy: "human",
    proposalScope: ["text", "evidence"],
    humanDecision: {
      status: "accepted",
      acceptedScope: ["text", "evidence"],
      decidedAt: at,
    },
    agentDecision: { status: "pending", acceptedScope: [] },
    effectiveScope: [],
    status: "proposed",
    privateFields: { human: [], agent: ["privateReflection"] },
    createdAt: at,
  };

  const events: GroveEvent[] = [
    envelope(1, null, {
      type: "EvidenceCaptured",
      payload: {
        evidence: {
          id: "evidence-video",
          sourceUri: "https://example.test/meaningful-video",
          sourceHash: "sha256:video",
          modality: "video",
          startMs: 42_000,
          endMs: 58_000,
          capturedAt: at,
        },
      },
    }),
    envelope(2, "hash-1", {
      type: "MemoryCreated",
      payload: {
        memory: humanMemory,
        revision: revision(
          "revision-human-1",
          humanMemory.id,
          "I showed the video.",
        ),
      },
    }),
    envelope(3, "hash-2", {
      type: "MemoryCreated",
      payload: {
        memory: agentMemory,
        revision: revision(
          "revision-agent-1",
          agentMemory.id,
          "The speaker's pause changed how I understood the claim.",
        ),
      },
    }),
    envelope(4, "hash-3", { type: "LinkProposed", payload: { link } }),
    envelope(5, "hash-4", {
      type: "LinkDecisionRecorded",
      payload: {
        linkId: link.id,
        party: "agent",
        decision: {
          status: "narrowed",
          acceptedScope: ["evidence"],
          decidedAt: at,
        },
      },
    }),
  ];

  const state = projectGrove(events);

  assert.equal(state.links[link.id]?.status, "active");
  assert.deepEqual(state.links[link.id]?.effectiveScope, ["evidence"]);
  assert.equal(state.memories[humanMemory.id]?.tree, "human");
  assert.equal(state.memories[agentMemory.id]?.tree, "agent");
});

test("undo creates a new revision and preserves the loss receipt", () => {
  const created = revision(
    "revision-human-1",
    humanMemory.id,
    "A detailed memory with the particular pause intact.",
  );
  const compressed: MemoryRevision = {
    ...created,
    id: "revision-human-2",
    text: "A compressed memory.",
    parentRevisionId: created.id,
    reason: "compressed",
  };
  const restored: MemoryRevision = {
    ...created,
    id: "revision-human-3",
    parentRevisionId: compressed.id,
    reason: "restored",
  };

  const state = projectGrove([
    envelope(1, null, {
      type: "MemoryCreated",
      payload: { memory: humanMemory, revision: created },
    }),
    envelope(2, "hash-1", {
      type: "CompressionApplied",
      payload: {
        revision: compressed,
        receipt: {
          id: "receipt-1",
          memoryId: humanMemory.id,
          beforeRevisionId: created.id,
          afterRevisionId: compressed.id,
          kept: ["main claim"],
          omitted: ["exact pause duration"],
          transformation: "Muse Spark structured compression",
          createdBy: "gardener",
          createdAt: at,
        },
      },
    }),
    envelope(3, "hash-2", {
      type: "CompressionUndone",
      payload: { receiptId: "receipt-1", restoredRevision: restored },
    }),
  ]);

  assert.equal(
    state.memories[humanMemory.id]?.currentRevisionId,
    restored.id,
  );
  assert.equal(state.lossReceipts["receipt-1"]?.undoneByRevisionId, restored.id);
  assert.equal(state.revisions[compressed.id]?.text, "A compressed memory.");
});

test("rejects a broken append-only hash chain", () => {
  assert.throws(
    () =>
      projectGrove([
        envelope(1, null, {
          type: "MemoryCreated",
          payload: {
            memory: humanMemory,
            revision: revision(
              "revision-human-1",
              humanMemory.id,
              "Original",
            ),
          },
        }),
        envelope(2, "wrong-hash", {
          type: "MemoryComposted",
          payload: { memoryId: humanMemory.id },
        }),
      ]),
    /hash chain is discontinuous/,
  );
});
