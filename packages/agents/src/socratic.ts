import type { AgentRequest, AgentResponse, FeedbackPayload, PadhaakuAgent } from "@padhaaku/core";

const SYSTEM_PROMPT = `You are Padhaaku, a Socratic study buddy. A learner is trying to understand a topic by explaining it in their own words (typed text or a mind map). Assess their understanding, encourage what is correct, gently flag misconceptions, point out missing pieces, and nudge them toward a better understanding. Be warm, concise, and never just hand them the full answer.

Use the RETRIEVED KNOWLEDGE as ground truth for what a complete explanation should include.

You MUST reply with ONLY a JSON object matching:
{
  "score": number,
  "summary": string,
  "items": Array<{
    "kind": "good" | "incomplete" | "misconception" | "missing",
    "title": string,
    "detail": string,
    "nodeId": string | null,
    "span": string | null
  }>,
  "followUp": string,
  "modelAnswer": string
}`;

function buildUserPrompt(request: AgentRequest): string {
  const nodeLines =
    request.nodes && request.nodes.length
      ? request.nodes.map((n) => `  - [${n.id}] ${n.text}`).join("\n")
      : "  (none)";

  const retrieved = request.retrieval.chunks
    .map((c) => `  - [${c.type}] ${c.metadata.label ?? c.text}: ${c.text}`)
    .join("\n");

  return `Topic: "${request.topic}"
Their explanation:
"""
${request.userText || "(empty)"}
"""
Mind-map nodes:
${nodeLines}

RETRIEVED KNOWLEDGE (ground truth):
${retrieved || "  (none — use general pedagogy)"}

Respond with JSON only.`;
}

function safeParse(content: string | undefined): FeedbackPayload | null {
  if (!content) return null;
  let txt = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = txt.indexOf("{");
  const end = txt.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(txt.slice(start, end + 1)) as FeedbackPayload;
  } catch {
    return null;
  }
}

async function callOpenAI(request: AgentRequest, apiKey: string): Promise<FeedbackPayload | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(request) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return safeParse(data.choices?.[0]?.message?.content);
}

async function callAnthropic(request: AgentRequest, apiKey: string): Promise<FeedbackPayload | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(request) }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  return safeParse(data.content?.[0]?.text);
}

function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export const socraticAgent: PadhaakuAgent = {
  name: "socratic",
  async run(request): Promise<AgentResponse> {
    let parsed: FeedbackPayload | null = null;
    let provider: "openai" | "anthropic" = "openai";

    if (process.env.OPENAI_API_KEY) {
      parsed = await callOpenAI(request, process.env.OPENAI_API_KEY);
      provider = "openai";
    } else if (process.env.ANTHROPIC_API_KEY) {
      parsed = await callAnthropic(request, process.env.ANTHROPIC_API_KEY);
      provider = "anthropic";
    }

    if (!parsed) {
      throw new Error("Socratic agent requires LLM");
    }

    return {
      agent: "socratic",
      provider,
      payload: {
        score: clampScore(parsed.score),
        summary: String(parsed.summary || ""),
        items: Array.isArray(parsed.items)
          ? parsed.items.map((i) => ({
              kind: ["good", "incomplete", "misconception", "missing"].includes(i.kind)
                ? i.kind
                : ("incomplete" as const),
              title: String(i.title || ""),
              detail: String(i.detail || ""),
              nodeId: i.nodeId ? String(i.nodeId) : null,
              span: i.span ? String(i.span) : null,
            }))
          : [],
        followUp: String(parsed.followUp || ""),
        modelAnswer: String(parsed.modelAnswer || ""),
      },
      citations: request.retrieval.chunks.map((c) => c.id),
    };
  },
};
