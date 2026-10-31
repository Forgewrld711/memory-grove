import { canonicalJson } from "../grove/ledger.ts";
import type { Evidence, GroveEvent, TreeOwner } from "../grove/types.ts";

export const GROVE_BUNDLE_FORMAT = "memory-grove.bundle.v1" as const;

export type PortableMemory = {
  sourceId: string;
  sourceProvider: string;
  sourceType: string;
  text: string;
  authorLabel: string;
  createdAt?: string;
  updatedAt?: string;
  proposedTree: TreeOwner;
  sourceConversationId?: string;
  sourceUri?: string;
  contentHash: string;
  metadata: Record<string, unknown>;
};

export type MemoryGroveBundle = {
  format: typeof GROVE_BUNDLE_FORMAT;
  exportedAt: string;
  source: { provider: string; accountLabel?: string; exportVersion?: string };
  memories: PortableMemory[];
  evidence: Evidence[];
  nativeEvents?: GroveEvent[];
};

export type ImportCandidate = PortableMemory & {
  status: "proposed" | "duplicate" | "conflict" | "invalid";
  reason: string;
};

export type ImportPlan = {
  sourceProvider: string;
  total: number;
  proposed: number;
  duplicates: number;
  conflicts: number;
  invalid: number;
  candidates: ImportCandidate[];
  commitPolicy: "explicit-review-required";
};

export async function createPortableMemory(input: Omit<PortableMemory, "contentHash">): Promise<PortableMemory> {
  const contentHash = await hashText(canonicalJson({
    provider: input.sourceProvider,
    sourceId: input.sourceId,
    text: input.text,
    author: input.authorLabel,
    createdAt: input.createdAt ?? null,
  }));
  return { ...input, contentHash };
}

export function planImport(bundle: MemoryGroveBundle, knownHashes: Set<string>): ImportPlan {
  if (bundle.format !== GROVE_BUNDLE_FORMAT) throw new Error("Unsupported memory bundle format");
  const seen = new Map<string, PortableMemory>();
  const candidates = bundle.memories.map<ImportCandidate>((memory) => {
    if (!memory.sourceId || !memory.sourceProvider || !memory.text.trim() || !memory.contentHash) {
      return { ...memory, status: "invalid", reason: "Missing required provenance or content" };
    }
    if (knownHashes.has(memory.contentHash)) {
      return { ...memory, status: "duplicate", reason: "Content hash already exists in this grove" };
    }
    const previous = seen.get(memory.sourceId);
    seen.set(memory.sourceId, memory);
    if (previous && previous.contentHash !== memory.contentHash) {
      return { ...memory, status: "conflict", reason: "Same source ID contains different content" };
    }
    return { ...memory, status: "proposed", reason: "Ready for human and Muse review" };
  });
  return {
    sourceProvider: bundle.source.provider,
    total: candidates.length,
    proposed: count(candidates, "proposed"), duplicates: count(candidates, "duplicate"),
    conflicts: count(candidates, "conflict"), invalid: count(candidates, "invalid"),
    candidates, commitPolicy: "explicit-review-required",
  };
}

export function exportNativeGrove(source: MemoryGroveBundle["source"], events: GroveEvent[], evidence: Evidence[]): MemoryGroveBundle {
  return { format: GROVE_BUNDLE_FORMAT, exportedAt: new Date().toISOString(), source, memories: [], evidence, nativeEvents: events };
}

function count(items: ImportCandidate[], status: ImportCandidate["status"]) { return items.filter((item) => item.status === status).length; }
async function hashText(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
