import assert from "node:assert/strict";
import test from "node:test";
import { buildMuseRequest, extractMuseText } from "../lib/providers/meta-model.ts";

test("resident Muse requests preserve bounded recent context", () => {
  const turns = Array.from({ length: 10 }, (_, index) => ({
    role: index % 2 === 0 ? "human" as const : "agent" as const,
    text: `turn-${index}`,
  }));
  const request = buildMuseRequest(turns);
  assert.equal(request.model, "muse-spark-1.3");
  assert.doesNotMatch(request.input, /turn-0/);
  assert.match(request.input, /turn-2/);
  assert.match(request.input, /turn-9/);
  assert.match(request.instructions, /never becomes a memory automatically/i);
});

test("extracts text from both compact and structured Responses payloads", () => {
  assert.equal(extractMuseText({ output_text: "  hello grove  " }), "hello grove");
  assert.equal(extractMuseText({ output: [{ content: [{ type: "output_text", text: "first" }, { text: "second" }] }] }), "first\nsecond");
});
