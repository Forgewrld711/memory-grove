import type { Evidence } from "../grove/types.ts";

export type LearningObservation = {
  id: string;
  evidence: Evidence[];
  prompt: string;
};

export type ReflectionProposal = {
  id: string;
  observationId: string;
  text: string;
  uncertainty: string[];
  evidenceIds: string[];
  status: "proposed";
};

export type ReflectionEvaluation = {
  proposalId: string;
  verdict: "supported" | "mixed" | "unsupported";
  notes: string;
  evidenceIds: string[];
};

export interface LearningMuseAdapter {
  reflect(observation: LearningObservation): Promise<ReflectionProposal>;
  evaluate(proposal: ReflectionProposal, observation: LearningObservation): Promise<ReflectionEvaluation>;
  revise(proposal: ReflectionProposal, evaluation: ReflectionEvaluation): Promise<ReflectionProposal>;
}

/**
 * OpenHuman-inspired learning loop: observe, reflect, evaluate, revise, propose.
 * The output is still only a proposal. The loop cannot promote itself into a tree.
 */
export async function runLearningLoop(adapter: LearningMuseAdapter, observation: LearningObservation) {
  const first = await adapter.reflect(observation);
  const evaluation = await adapter.evaluate(first, observation);
  const final = evaluation.verdict === "supported" ? first : await adapter.revise(first, evaluation);
  return { first, evaluation, final: { ...final, status: "proposed" as const } };
}
