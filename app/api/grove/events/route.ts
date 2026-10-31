import { and, asc, eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { groveEvents } from "@/db/schema";
import { appendGroveEvent } from "@/lib/grove/ledger";
import { projectGrove } from "@/lib/grove/projector";
import type { ActorKind, GroveEvent } from "@/lib/grove/types";

const eventTypes = new Set<GroveEvent["type"]>([
  "EvidenceCaptured", "MemoryCreated", "MemoryRevised", "MemoryComposted",
  "MemoryRestored", "ProposalCreated", "ProposalResolved", "LinkProposed",
  "LinkScopeChanged", "LinkDecisionRecorded", "LinkWithdrawn",
  "CompressionApplied", "CompressionUndone", "WeatherChosen",
]);
const actorKinds = new Set<ActorKind>(["human", "agent", "gardener", "system"]);

export async function GET(request: Request) {
  const identity = await requestIdentity();
  if (!identity) return unauthorized();
  const streamId = new URL(request.url).searchParams.get("streamId")?.trim();
  if (!streamId) return Response.json({ error: "streamId is required" }, { status: 400 });

  try {
    const events = await readEvents(identity.ownerUserId, streamId);
    return Response.json({ events, state: projectGrove(events) });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  const identity = await requestIdentity();
  if (!identity) return unauthorized();

  try {
    const body = await request.json() as Record<string, unknown>;
    const streamId = textField(body.streamId);
    const type = textField(body.type) as GroveEvent["type"];
    const actorKind = textField(body.actorKind) as ActorKind;
    if (!streamId || !eventTypes.has(type)) {
      return Response.json({ error: "A valid streamId and event type are required" }, { status: 400 });
    }
    if (!actorKinds.has(actorKind)) {
      return Response.json({ error: "A valid actorKind is required" }, { status: 400 });
    }
    if (body.payload === null || typeof body.payload !== "object") {
      return Response.json({ error: "payload must be an object" }, { status: 400 });
    }

    const events = await readEvents(identity.ownerUserId, streamId);
    const event = await appendGroveEvent(events, {
      id: crypto.randomUUID(),
      streamId,
      type,
      actorId: actorKind === "human" ? identity.actorId : textField(body.actorId) || actorKind,
      actorKind,
      occurredAt: new Date().toISOString(),
      payload: body.payload,
    });

    const db = getDb();
    await db.insert(groveEvents).values({
      id: event.id,
      ownerUserId: identity.ownerUserId,
      streamId: event.streamId,
      sequence: event.sequence,
      eventType: event.type,
      actorId: event.actorId,
      actorKind: event.actorKind,
      occurredAt: event.occurredAt,
      previousHash: event.previousHash,
      eventHash: event.eventHash,
      payloadJson: JSON.stringify(event.payload),
    });
    return Response.json({ event, state: projectGrove([...events, event]) }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

async function requestIdentity() {
  const user = await getChatGPTUser();
  if (user) return { ownerUserId: user.userId, actorId: user.userId };
  if (process.env.NODE_ENV !== "production") {
    return { ownerUserId: "local-demo-user", actorId: "local-demo-user" };
  }
  return null;
}

async function readEvents(ownerUserId: string, streamId: string): Promise<GroveEvent[]> {
  const db = getDb();
  const rows = await db.select().from(groveEvents)
    .where(and(eq(groveEvents.ownerUserId, ownerUserId), eq(groveEvents.streamId, streamId)))
    .orderBy(asc(groveEvents.sequence));
  return rows.map((row) => ({
    id: row.id, streamId: row.streamId, sequence: row.sequence,
    type: row.eventType, actorId: row.actorId, actorKind: row.actorKind,
    occurredAt: row.occurredAt, previousHash: row.previousHash,
    eventHash: row.eventHash, payload: JSON.parse(row.payloadJson),
  }) as GroveEvent);
}

function textField(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function unauthorized() { return Response.json({ error: "Sign in with ChatGPT to access a grove" }, { status: 401 }); }
function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = message.includes("UNIQUE constraint") ? 409 : message.includes("unavailable") ? 503 : 400;
  return Response.json({ error: message }, { status });
}
