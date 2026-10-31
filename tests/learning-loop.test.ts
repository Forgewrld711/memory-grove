import assert from "node:assert/strict";
import test from "node:test";
import { runLearningLoop, type LearningMuseAdapter } from "../lib/learning/loop.ts";

test("learning loop remains a proposal after evaluation and revision", async () => {
  const adapter: LearningMuseAdapter = {
    async reflect(observation) { return { id:"r1", observationId:observation.id, text:"First read", uncertainty:["tone"], evidenceIds:["e1"], status:"proposed" }; },
    async evaluate(proposal) { return { proposalId:proposal.id, verdict:"mixed", notes:"The pause supports a narrower claim", evidenceIds:["e1"] }; },
    async revise(proposal) { return { ...proposal, id:"r2", text:"Narrower read" }; },
  };
  const result = await runLearningLoop(adapter, { id:"o1", prompt:"What changed?", evidence:[] });
  assert.equal(result.final.text, "Narrower read");
  assert.equal(result.final.status, "proposed");
});
