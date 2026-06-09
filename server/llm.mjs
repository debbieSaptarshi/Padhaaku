import { finalizeFeedback } from "./schema.mjs";

const SYSTEM_PROMPT = `You are Padhaaku, a Socratic study buddy. A learner explains a topic in their own words (mind map nodes or typed text). Assess understanding, encourage what's correct, flag misconceptions, note missing pieces, and nudge thinking forward.

RULES:
- Never give the full ideal answer on the first review — set "modelAnswer" to empty string "" unless the learner has made multiple attempts.
- Maximum 6 feedback items.
- "nodeId" must match a provided mind-map node id, or be null.
- "span" must be an EXACT substring of the learner's text, or null.
- One followUp question only — interrogative, not a lecture.
- Be warm and concise.

Reply with ONLY a JSON object:
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

function buildUserPrompt({ topic, mode, text, nodes, attemptNumber }) {
  const nodeLines =
    nodes?.length
      ? nodes.map((n) => `  - [${n.id}] ${n.text}`).join("\n")
      : "  (none)";
  return `Topic: "${topic}"
Attempt number: ${attemptNumber}
Input mode: ${mode}
Learner explanation:
"""
${text || "(empty)"}
"""
Mind-map nodes (use these ids in nodeId when relevant):
${nodeLines}

Assess and return JSON only.${attemptNumber < 2 ? " Leave modelAnswer as empty string." : ""}`;
}

function safeParse(content) {
  if (!content) return null;
  let txt = content.trim();
  txt = txt.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = txt.indexOf("{");
  const end = txt.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(txt.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callOpenAI(payload, apiKey) {
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
        { role: "user", content: buildUserPrompt(payload) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return safeParse(data.choices?.[0]?.message?.content);
}

async function callAnthropic(payload, apiKey) {
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
      messages: [{ role: "user", content: buildUserPrompt(payload) }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return safeParse(data.content?.[0]?.text);
}

export function hasLLM() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export async function analyzeWithLLM(payload) {
  let parsed = null;
  let provider = null;
  if (process.env.OPENAI_API_KEY) {
    parsed = await callOpenAI(payload, process.env.OPENAI_API_KEY);
    provider = "openai";
  } else if (process.env.ANTHROPIC_API_KEY) {
    parsed = await callAnthropic(payload, process.env.ANTHROPIC_API_KEY);
    provider = "anthropic";
  }
  if (!parsed) return null;

  return {
    provider,
    topicLabel: payload.topic,
    score: parsed.score,
    summary: String(parsed.summary || ""),
    items: Array.isArray(parsed.items)
      ? parsed.items.map((i) => ({
          kind: ["good", "incomplete", "misconception", "missing"].includes(i.kind)
            ? i.kind
            : "incomplete",
          title: String(i.title || ""),
          detail: String(i.detail || ""),
          nodeId: i.nodeId ? String(i.nodeId) : null,
          span: i.span ? String(i.span) : null,
        }))
      : [],
    followUp: String(parsed.followUp || ""),
    modelAnswer: parsed.modelAnswer ? String(parsed.modelAnswer) : "",
  };
}
