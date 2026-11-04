export const DEFAULT_MUSE_MODEL = "muse-spark-1.3";

export type GroveChatTurn = {
  role: "human" | "agent";
  text: string;
};

export type MetaResponsesPayload = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      text?: unknown;
      type?: unknown;
    }>;
  }>;
};

const residentMuseInstructions = [
  "You are the resident Muse inside Memory Grove, a bilateral memory system.",
  "Speak warmly and directly in first person, using no more than 90 words.",
  "A conversation turn is evidence first and never becomes a memory automatically.",
  "If the human asks you to remember something, offer a memory proposal that still requires explicit review.",
  "Never claim to accept a consent link on behalf of the human or manufacture either tree's decision.",
  "Human memories and agent reflections keep separate authorship even when linked by shared evidence.",
].join(" ");

export function buildMuseRequest(turns: GroveChatTurn[], model = DEFAULT_MUSE_MODEL) {
  const recent = turns.slice(-8);
  const transcript = recent
    .map((turn) => `${turn.role === "human" ? "Human" : "Muse"}: ${turn.text.trim()}`)
    .join("\n");

  return {
    model,
    instructions: residentMuseInstructions,
    input: transcript,
    reasoning: { effort: "low" },
    max_output_tokens: 220,
  };
}

export function extractMuseText(payload: MetaResponsesPayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => typeof content.text === "string" ? content.text.trim() : "")
    .filter(Boolean) ?? [];

  return chunks.join("\n").trim();
}

export async function askResidentMuse(input: {
  apiKey: string;
  turns: GroveChatTurn[];
  model?: string;
  fetcher?: typeof fetch;
}) {
  const fetcher = input.fetcher ?? fetch;
  const response = await fetcher("https://api.meta.ai/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildMuseRequest(input.turns, input.model)),
  });

  const payload = await response.json() as MetaResponsesPayload & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || `Meta Model API returned ${response.status}`);
  }

  const text = extractMuseText(payload);
  if (!text) throw new Error("Meta Model API returned no text");
  return text;
}
