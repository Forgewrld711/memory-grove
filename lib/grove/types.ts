export type Id = string;
export type IsoDateTime = string;
export type TreeOwner = "human" | "agent";
export type ActorKind = TreeOwner | "gardener" | "system";

export type MemoryVisibility = "private" | "linkable" | "shared";
export type MemoryStatus = "active" | "composted";

export type Memory = {
  id: Id;
  tree: TreeOwner;
  authorId: Id;
  currentRevisionId: Id;
  syntheticFixture: boolean;
  visibility: MemoryVisibility;
  status: MemoryStatus;
  evidenceIds: Id[];
  createdAt: IsoDateTime;
};

export type MemoryRevision = {
  id: Id;
  memoryId: Id;
  text: string;
  parentRevisionId: Id | null;
  reason: "created" | "edited" | "compressed" | "restored";
  authoredBy: Id;
  createdAt: IsoDateTime;
};

export type EvidenceModality =
  | "video"
  | "audio"
  | "transcript"
  | "frame"
  | "web";

export type Evidence = {
  id: Id;
  sourceUri: string;
  sourceHash: string;
  modality: EvidenceModality;
  startMs?: number;
  endMs?: number;
  capturedAt: IsoDateTime;
};

export type ConsentDecisionStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "narrowed";

export type ConsentDecision = {
  status: ConsentDecisionStatus;
  acceptedScope: string[];
  decidedAt?: IsoDateTime;
};

export type ConsentLinkStatus =
  | "proposed"
  | "negotiating"
  | "active"
  | "withdrawn";

export type ConsentLink = {
  id: Id;
  humanMemoryId: Id;
  agentMemoryId: Id;
  evidenceIds: Id[];
  proposedBy: TreeOwner;
  proposalScope: string[];
  humanDecision: ConsentDecision;
  agentDecision: ConsentDecision;
  effectiveScope: string[];
  status: ConsentLinkStatus;
  privateFields: Record<TreeOwner, string[]>;
  createdAt: IsoDateTime;
  withdrawnAt?: IsoDateTime;
};

export type LossReceipt = {
  id: Id;
  memoryId: Id;
  beforeRevisionId: Id;
  afterRevisionId: Id;
  kept: string[];
  omitted: string[];
  transformation: string;
  reversibleUntil?: IsoDateTime;
  createdBy: Id;
  createdAt: IsoDateTime;
  undoneByRevisionId?: Id;
};

export type WeatherComposition = {
  sky: string;
  precipitation?: string;
  wind?: string;
  light?: string;
  explanation?: string;
};

export type WeatherExpression = {
  id: Id;
  tree: TreeOwner;
  chosenBy: Id;
  composition: WeatherComposition;
  chosenAt: IsoDateTime;
};

export type GardenerProposalKind =
  | "duplicate"
  | "contradiction"
  | "compost"
  | "reorganize"
  | "compress"
  | "repair_evidence";

export type GardenerProposal = {
  id: Id;
  tree: TreeOwner;
  kind: GardenerProposalKind;
  memoryIds: Id[];
  rationale: string;
  status: "pending" | "approved" | "rejected";
  createdBy: Id;
  createdAt: IsoDateTime;
  resolvedAt?: IsoDateTime;
};

export type EventEnvelope<TType extends string, TPayload> = {
  id: Id;
  streamId: Id;
  sequence: number;
  type: TType;
  actorId: Id;
  actorKind: ActorKind;
  occurredAt: IsoDateTime;
  previousHash: string | null;
  eventHash: string;
  payload: TPayload;
};

export type GroveEvent =
  | EventEnvelope<"EvidenceCaptured", { evidence: Evidence }>
  | EventEnvelope<
      "MemoryCreated",
      { memory: Memory; revision: MemoryRevision }
    >
  | EventEnvelope<"MemoryRevised", { revision: MemoryRevision }>
  | EventEnvelope<"MemoryComposted", { memoryId: Id }>
  | EventEnvelope<"MemoryRestored", { memoryId: Id }>
  | EventEnvelope<"ProposalCreated", { proposal: GardenerProposal }>
  | EventEnvelope<
      "ProposalResolved",
      {
        proposalId: Id;
        decision: "approved" | "rejected";
        resolvedAt: IsoDateTime;
      }
    >
  | EventEnvelope<"LinkProposed", { link: ConsentLink }>
  | EventEnvelope<
      "LinkScopeChanged",
      { linkId: Id; proposalScope: string[] }
    >
  | EventEnvelope<
      "LinkDecisionRecorded",
      { linkId: Id; party: TreeOwner; decision: ConsentDecision }
    >
  | EventEnvelope<
      "LinkWithdrawn",
      { linkId: Id; withdrawnAt: IsoDateTime }
    >
  | EventEnvelope<
      "CompressionApplied",
      { receipt: LossReceipt; revision: MemoryRevision }
    >
  | EventEnvelope<
      "CompressionUndone",
      { receiptId: Id; restoredRevision: MemoryRevision }
    >
  | EventEnvelope<"WeatherChosen", { weather: WeatherExpression }>;

export type GroveState = {
  streamId: Id | null;
  lastSequence: number;
  lastEventHash: string | null;
  memories: Record<Id, Memory>;
  revisions: Record<Id, MemoryRevision>;
  evidence: Record<Id, Evidence>;
  links: Record<Id, ConsentLink>;
  lossReceipts: Record<Id, LossReceipt>;
  proposals: Record<Id, GardenerProposal>;
  weather: Record<TreeOwner, WeatherExpression | null>;
};
