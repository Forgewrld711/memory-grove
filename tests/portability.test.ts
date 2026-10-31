import assert from "node:assert/strict";
import test from "node:test";
import { createPortableMemory, GROVE_BUNDLE_FORMAT, planImport } from "../lib/portability/bundle.ts";

test("provider memories arrive as proposals, never silent tree writes", async () => {
  const memory = await createPortableMemory({ sourceId:"chat-1:turn-2", sourceProvider:"example-provider", sourceType:"conversation_turn", text:"I changed my mind.", authorLabel:"assistant", proposedTree:"agent", metadata:{} });
  const plan = planImport({ format:GROVE_BUNDLE_FORMAT, exportedAt:new Date(0).toISOString(), source:{provider:"example-provider"}, memories:[memory], evidence:[] }, new Set());
  assert.equal(plan.proposed, 1);
  assert.equal(plan.commitPolicy, "explicit-review-required");
  assert.equal(plan.candidates[0].status, "proposed");
});

test("known content is marked duplicate before import", async () => {
  const memory = await createPortableMemory({ sourceId:"m-1", sourceProvider:"example-provider", sourceType:"memory", text:"Already here", authorLabel:"assistant", proposedTree:"agent", metadata:{} });
  const plan = planImport({ format:GROVE_BUNDLE_FORMAT, exportedAt:new Date(0).toISOString(), source:{provider:"example-provider"}, memories:[memory], evidence:[] }, new Set([memory.contentHash]));
  assert.equal(plan.duplicates, 1);
  assert.equal(plan.candidates[0].status, "duplicate");
});
