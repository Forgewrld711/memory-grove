import type { Evidence } from "../grove/types.ts";

export type VideoMoment = {
  sourceUri: string;
  sourceHash: string;
  startMs: number;
  endMs: number;
  transcript?: string;
  frameDescription?: string;
  score: number;
};

export interface VideoSemanticSearchAdapter {
  readonly providerId: string;
  search(input: { query: string; sourceUris?: string[]; limit: number }): Promise<VideoMoment[]>;
}

export function momentToEvidence(moment: VideoMoment, capturedAt = new Date().toISOString()): Evidence {
  if (moment.startMs < 0 || moment.endMs <= moment.startMs) {
    throw new Error("Video evidence must be a valid time span");
  }
  return {
    id: crypto.randomUUID(), sourceUri: moment.sourceUri, sourceHash: moment.sourceHash,
    modality: "video", startMs: moment.startMs, endMs: moment.endMs, capturedAt,
  };
}
