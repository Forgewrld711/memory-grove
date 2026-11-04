import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { askResidentMuse, type GroveChatTurn } from "@/lib/providers/meta-model";

const hourlyTurnLimit = 12;

export async function POST(request: Request) {
  const apiKey = env.MODEL_API_KEY || process.env.MODEL_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Muse runtime secret is not configured" }, { status: 503 });
  }

  try {
    const body = await request.json() as { turns?: unknown };
    const turns = parseTurns(body.turns);
    if (!turns.length || turns.at(-1)?.role !== "human") {
      return Response.json({ error: "A human chat turn is required" }, { status: 400 });
    }
    if (!await reserveMuseTurn(request)) {
      return Response.json({ error: "This grove has reached its hourly demo limit" }, { status: 429 });
    }

    const text = await askResidentMuse({ apiKey, turns });
    return Response.json({ text, model: "muse-spark-1.3", memoryWrite: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Muse request failed";
    return Response.json({ error: message }, { status: 502 });
  }
}

async function reserveMuseTurn(request: Request) {
  if (!env.DB) return process.env.NODE_ENV !== "production";
  const identity = await getChatGPTUser();
  const source = identity?.userId
    || request.headers.get("cf-connecting-ip")
    || `${request.headers.get("user-agent") || "anonymous"}:anonymous`;
  const subjectHash = await sha256(source);
  const bucketStart = new Date().toISOString().slice(0, 13);

  await env.DB.prepare(`
    INSERT INTO muse_usage (subject_hash, bucket_start, request_count)
    VALUES (?1, ?2, 1)
    ON CONFLICT(subject_hash, bucket_start)
    DO UPDATE SET request_count = request_count + 1
  `).bind(subjectHash, bucketStart).run();
  const usage = await env.DB.prepare(`
    SELECT request_count FROM muse_usage
    WHERE subject_hash = ?1 AND bucket_start = ?2
  `).bind(subjectHash, bucketStart).first<{ request_count: number }>();
  return (usage?.request_count ?? hourlyTurnLimit + 1) <= hourlyTurnLimit;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseTurns(value: unknown): GroveChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-8).flatMap((turn) => {
    if (!turn || typeof turn !== "object") return [];
    const record = turn as Record<string, unknown>;
    if (record.role !== "human" && record.role !== "agent") return [];
    if (typeof record.text !== "string") return [];
    const text = record.text.trim().slice(0, 4_000);
    return text ? [{ role: record.role, text }] : [];
  });
}
