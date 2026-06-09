export function hasLLM() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
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

async function callOpenAI({ system, user }, apiKey) {
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
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return safeParse(data.choices?.[0]?.message?.content);
}

async function callAnthropic({ system, user }, apiKey) {
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
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return safeParse(data.content?.[0]?.text);
}

export async function callLLMJson({ system, user }) {
  if (process.env.OPENAI_API_KEY) {
    return callOpenAI({ system, user }, process.env.OPENAI_API_KEY);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return callAnthropic({ system, user }, process.env.ANTHROPIC_API_KEY);
  }
  return null;
}
