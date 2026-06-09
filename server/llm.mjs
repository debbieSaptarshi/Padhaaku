// Legacy single-shot LLM provider. The Hybrid RAG orchestrator is preferred;
// this module remains as a fallback when the pipeline is disabled or fails.

import { hasLLM, callLLMJson } from "./llm-client.mjs";

export { hasLLM };

const SYSTEM_PROMPT = `You are Padhaaku, a Socratic study buddy. A learner is trying to understand a topic by explaining it in their own words (typed text or a mind map). Your job is to assess their understanding, encourage what is correct, gently flag misconceptions, point out missing pieces, and nudge them toward a better understanding. Be warm, concise, and never just hand them the full answer.

You MUST reply with ONLY a JSON object (no markdown) matching this TypeScript type:
{
  "score": number,            // 0-100, how complete/accurate their explanation is
  "summary": string,          // 1-2 sentence encouraging assessment
  "items": Array<{
    "kind": "good" | "incomplete" | "misconception" | "missing",
    "title": string,          // short label
    "detail": string,         // one sentence of guidance
    "nodeId": string | null,  // id of the mind-map node this refers to, if any
    "span": string | null     // an EXACT substring of the learner's text to highlight, if any
  }>,
  "followUp": string,         // one probing question to push their thinking
  "modelAnswer": string       // a short ideal explanation of the topic
}`;

function buildUserPrompt({ topic, mode, text, nodes }) {
  const nodeLines =
    nodes && nodes.length
      ? nodes.map((n) => `  - [${n.id}] ${n.text}`).join("\n")
      : "  (none)";
  return `Topic the learner is studying: "${topic}"
Input mode: ${mode}
Their explanation (free text):
"""
${text || "(empty)"}
"""
Mind-map nodes (id -> text), reference these ids in "nodeId" when relevant:
${nodeLines}

Assess their understanding and respond with the JSON object only.`;
}

export async function analyzeWithLLM(payload) {
  const parsed = await callLLMJson({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(payload),
  });
  if (!parsed) return null;
  const provider = process.env.OPENAI_API_KEY ? "openai" : "anthropic";

  return {
    provider,
    topicLabel: payload.topic,
    score: clampScore(parsed.score),
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
    modelAnswer: String(parsed.modelAnswer || ""),
  };
}

function clampScore(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}
