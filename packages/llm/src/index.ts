import type { StudyMessage } from "@padhaaku/core";

export function hasLlm(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export function llmProvider(): "openai" | "anthropic" | null {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

function formatContextBlock(chunks: Array<{ id: string; type: string; text: string }>): string {
  if (!chunks.length) return "(no retrieved context)";
  return chunks
    .map((chunk, index) => `[${index + 1}] (${chunk.type}) ${chunk.text}`)
    .join("\n");
}

export async function explainWithLlm(params: {
  question: string;
  history: StudyMessage[];
  topicLabel: string;
  contextChunks: Array<{ id: string; type: string; text: string }>;
}): Promise<string> {
  const provider = llmProvider();
  if (!provider) {
    throw new Error("No LLM API key configured");
  }

  const context = formatContextBlock(params.contextChunks);
  const system = [
    "You are Padhaaku, a patient study buddy.",
    "Ground your answer in the retrieved facts below when they are relevant.",
    "Use markdown with short sections: definition, key ideas, a simple example, and one practice question.",
    "Retrieved facts:",
    context,
  ].join("\n");

  const messages = [
    ...params.history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user" as const, content: params.question },
  ];

  if (provider === "openai") {
    return callOpenAi(system, messages);
  }

  return callAnthropic(system, messages);
}

export async function assessWithLlm(params: {
  topic: string;
  userText: string;
  nodes: Array<{ id: string; text: string }>;
  contextChunks: Array<{ id: string; type: string; text: string }>;
}): Promise<Record<string, unknown>> {
  const provider = llmProvider();
  if (!provider) {
    throw new Error("No LLM API key configured");
  }

  const nodeLines =
    params.nodes.length > 0
      ? params.nodes.map((node) => `  - [${node.id}] ${node.text}`).join("\n")
      : "  (none)";

  const system = [
    "You are Padhaaku, a Socratic study buddy.",
    "Assess the learner using ONLY the retrieved facts when possible.",
    "Reply with ONLY a JSON object:",
    '{"score":number,"summary":string,"items":[{"kind":"good"|"incomplete"|"misconception"|"missing","title":string,"detail":string,"nodeId":string|null,"span":string|null}],"followUp":string,"modelAnswer":string}',
    "Retrieved facts:",
    formatContextBlock(params.contextChunks),
  ].join("\n");

  const user = [
    `Topic: "${params.topic}"`,
    `Learner explanation:\n"""\n${params.userText || "(empty)"}\n"""`,
    `Mind-map nodes:\n${nodeLines}`,
  ].join("\n\n");

  const content =
    provider === "openai"
      ? await callOpenAi(system, [{ role: "user", content: user }], true)
      : await callAnthropic(system, [{ role: "user", content: user }], true);

  return parseJsonObject(content);
}

async function callOpenAi(
  system: string,
  messages: Array<{ role: string; content: string }>,
  json = false,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: json ? 0.4 : 0.7,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("OpenAI returned an empty response");
  return reply;
}

async function callAnthropic(
  system: string,
  messages: Array<{ role: string; content: string }>,
  json = false,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
      max_tokens: 1024,
      system: json ? `${system}\nRespond with JSON only.` : system,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };
  const reply = data.content?.[0]?.text?.trim();
  if (!reply) throw new Error("Anthropic returned an empty response");
  return reply;
}

function parseJsonObject(content: string): Record<string, unknown> {
  let text = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("LLM did not return JSON");
  }
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}
