import type {
  ConsentDecision,
  ConsentLink,
  GroveEvent,
  GroveState,
  TreeOwner,
} from "./types";

export function emptyGroveState(): GroveState {
  return {
    streamId: null,
    lastSequence: 0,
    lastEventHash: null,
    memories: {},
    revisions: {},
    evidence: {},
    links: {},
    lossReceipts: {},
    proposals: {},
    weather: { human: null, agent: null },
  };
}

export function projectGrove(events: readonly GroveEvent[]): GroveState {
  return events.reduce(applyGroveEvent, emptyGroveState());
}

export function applyGroveEvent(
  previous: GroveState,
  event: GroveEvent,
): GroveState {
  assertLedgerContinuity(previous, event);

  const state: GroveState = {
    ...previous,
    streamId: event.streamId,
    lastSequence: event.sequence,
    lastEventHash: event.eventHash,
    memories: { ...previous.memories },
    revisions: { ...previous.revisions },
    evidence: { ...previous.evidence },
    links: { ...previous.links },
    lossReceipts: { ...previous.lossReceipts },
    proposals: { ...previous.proposals },
    weather: { ...previous.weather },
  };

  switch (event.type) {
    case "EvidenceCaptured": {
      state.evidence[event.payload.evidence.id] = event.payload.evidence;
      break;
    }
    case "MemoryCreated": {
      const { memory, revision } = event.payload;
      if (revision.memoryId !== memory.id) {
        throw new Error("MemoryCreated revision belongs to another memory");
      }
      state.memories[memory.id] = memory;
      state.revisions[revision.id] = revision;
      break;
    }
    case "MemoryRevised": {
      setCurrentRevision(state, event.payload.revision);
      break;
    }
    case "MemoryComposted": {
      setMemoryStatus(state, event.payload.memoryId, "composted");
      break;
    }
    case "MemoryRestored": {
      setMemoryStatus(state, event.payload.memoryId, "active");
      break;
    }
    case "ProposalCreated": {
      state.proposals[event.payload.proposal.id] = event.payload.proposal;
      break;
    }
    case "ProposalResolved": {
      const proposal = requireRecord(
        state.proposals,
        event.payload.proposalId,
        "proposal",
      );
      state.proposals[proposal.id] = {
        ...proposal,
        status: event.payload.decision,
        resolvedAt: event.payload.resolvedAt,
      };
      break;
    }
    case "LinkProposed": {
      const link = event.payload.link;
      requireMemoryOwnership(state, link.humanMemoryId, "human");
      requireMemoryOwnership(state, link.agentMemoryId, "agent");
      state.links[link.id] = normalizeLink(link);
      break;
    }
    case "LinkScopeChanged": {
      const link = requireRecord(state.links, event.payload.linkId, "link");
      state.links[link.id] = normalizeLink({
        ...link,
        proposalScope: unique(event.payload.proposalScope),
      });
      break;
    }
    case "LinkDecisionRecorded": {
      const { linkId, party, decision } = event.payload;
      const link = requireRecord(state.links, linkId, "link");
      const decisionKey =
        party === "human" ? "humanDecision" : "agentDecision";
      state.links[link.id] = normalizeLink({
        ...link,
        [decisionKey]: decision,
      });
      break;
    }
    case "LinkWithdrawn": {
      const link = requireRecord(state.links, event.payload.linkId, "link");
      state.links[link.id] = {
        ...link,
        status: "withdrawn",
        withdrawnAt: event.payload.withdrawnAt,
      };
      break;
    }
    case "CompressionApplied": {
      const { receipt, revision } = event.payload;
      if (receipt.afterRevisionId !== revision.id) {
        throw new Error("Loss receipt does not identify the compressed revision");
      }
      setCurrentRevision(state, revision);
      state.lossReceipts[receipt.id] = receipt;
      break;
    }
    case "CompressionUndone": {
      const receipt = requireRecord(
        state.lossReceipts,
        event.payload.receiptId,
        "loss receipt",
      );
      const restoredRevision = event.payload.restoredRevision;
      if (restoredRevision.memoryId !== receipt.memoryId) {
        throw new Error("Undo revision belongs to another memory");
      }
      setCurrentRevision(state, restoredRevision);
      state.lossReceipts[receipt.id] = {
        ...receipt,
        undoneByRevisionId: restoredRevision.id,
      };
      break;
    }
    case "WeatherChosen": {
      state.weather[event.payload.weather.tree] = event.payload.weather;
      break;
    }
  }

  return state;
}

function assertLedgerContinuity(state: GroveState, event: GroveEvent) {
  if (state.streamId && state.streamId !== event.streamId) {
    throw new Error("Cannot project multiple grove streams together");
  }
  if (event.sequence !== state.lastSequence + 1) {
    throw new Error(
      `Expected event sequence ${state.lastSequence + 1}, received ${event.sequence}`,
    );
  }
  if (event.previousHash !== state.lastEventHash) {
    throw new Error("Event hash chain is discontinuous");
  }
}

function setCurrentRevision(
  state: GroveState,
  revision: GroveState["revisions"][string],
) {
  const memory = requireRecord(state.memories, revision.memoryId, "memory");
  state.revisions[revision.id] = revision;
  state.memories[memory.id] = {
    ...memory,
    currentRevisionId: revision.id,
  };
}

function setMemoryStatus(
  state: GroveState,
  memoryId: string,
  status: "active" | "composted",
) {
  const memory = requireRecord(state.memories, memoryId, "memory");
  state.memories[memory.id] = { ...memory, status };
}

function requireMemoryOwnership(
  state: GroveState,
  memoryId: string,
  expectedTree: TreeOwner,
) {
  const memory = requireRecord(state.memories, memoryId, "memory");
  if (memory.tree !== expectedTree) {
    throw new Error(`${expectedTree} link endpoint belongs to ${memory.tree} tree`);
  }
}

function normalizeLink(link: ConsentLink): ConsentLink {
  if (link.status === "withdrawn") return link;

  const humanScope = acceptedScope(link.humanDecision, link.proposalScope);
  const agentScope = acceptedScope(link.agentDecision, link.proposalScope);
  const effectiveScope = humanScope.filter((item) => agentScope.includes(item));

  let status: ConsentLink["status"] = "proposed";
  if (
    link.humanDecision.status === "declined" ||
    link.agentDecision.status === "declined"
  ) {
    status = "withdrawn";
  } else if (
    isAffirmative(link.humanDecision) &&
    isAffirmative(link.agentDecision) &&
    effectiveScope.length > 0
  ) {
    status = "active";
  } else if (
    link.humanDecision.status !== "pending" ||
    link.agentDecision.status !== "pending"
  ) {
    status = "negotiating";
  }

  return { ...link, effectiveScope: unique(effectiveScope), status };
}

function acceptedScope(
  decision: ConsentDecision,
  proposalScope: string[],
): string[] {
  if (decision.status === "pending" || decision.status === "declined") return [];
  return decision.status === "accepted"
    ? unique(proposalScope)
    : unique(decision.acceptedScope);
}

function isAffirmative(decision: ConsentDecision) {
  return decision.status === "accepted" || decision.status === "narrowed";
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function requireRecord<T>(
  records: Record<string, T>,
  id: string,
  label: string,
): T {
  const value = records[id];
  if (!value) throw new Error(`Unknown ${label}: ${id}`);
  return value;
}
