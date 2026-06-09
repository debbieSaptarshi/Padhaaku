import { validateFeedback } from "./validate.mjs";

const SYSTEM_PROMPT = `You are Padhaaku, a Socratic study buddy. A learner explains a topic in their own words — typed text, a mind map, or handwritten work on a canvas. Assess their understanding, encourage what is correct, flag misconceptions, note missing pieces, and nudge them forward. Be warm and concise.

CRITICAL RULES:
- Never dump a complete textbook answer in the followUp.
- The modelAnswer field is for later unlock only — keep it under 120 words.
- On early attempts, focus on diagnosis and one probing followUp question.
- For handwriting mode, read the caption and any image of their written work carefully.
- Reference mind-map node ids when provided.

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

function buildUserPrompt(payload) {
  const nodeLines =
    payload.nodes?.length
      ? payload.nodes.map((n) => `  - [${n.id}] ${n.text}`).join("\n")
      : "  (none)";
  const edgeLines =
    payload.edges?.length
      ? payload.edges.map((e) => `  - ${e.from} → ${e.to}`).join("\n")
      : "  (none)";

  let extra = "";
  if (payload.mode === "handwriting") {
    extra = `\nHandwriting mode: the learner drew on a ruled canvas. Caption describing their ink: "${payload.text || "(none)"}". Stroke count: ${payload.strokes?.length || 0}.`;
  }

  return `Topic: "${payload.topic}"
Input mode: ${payload.mode}
Attempt number: ${payload.attemptNumber || 1}
Their explanation text / caption:
"""
${payload.text || "(empty)"}
"""
Mind-map nodes:
${nodeLines}
Mind-map edges:
${edgeLines}
${extra}

Assess understanding. JSON only.`;
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
  const hasImage =
    payload.mode === "handwriting" &&
    payload.handwritingImage &&
    payload.handwritingImage.startsWith("data:image");

  const userContent = hasImage
    ? [
        { type: "text", text: buildUserPrompt(payload) },
        {
          type: "image_url",
          image_url: { url: payload.handwritingImage, detail: "high" },
        },
      ]
    : buildUserPrompt(payload);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: hasImage
        ? process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"
        : process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return safeParse(data.choices?.[0]?.message?.content);
}

async function callAnthropic(payload, apiKey) {
  const blocks = [{ type: "text", text: buildUserPrompt(payload) }];
  if (
    payload.mode === "handwriting" &&
    payload.handwritingImage?.startsWith("data:image")
  ) {
    const base64 = payload.handwritingImage.split(",")[1];
    const media = payload.handwritingImage.includes("png") ? "image/png" : "image/jpeg";
    blocks.push({
      type: "image",
      source: { type: "base64", media_type: media, data: base64 },
    });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: blocks }],
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
  const validated = validateFeedback(parsed, payload);
  if (!validated) return null;

  return {
    provider,
    topicLabel: payload.topic,
    ...validated,
  };
}
