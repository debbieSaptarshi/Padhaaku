import type { AgentRequest, AgentResponse, PadhaakuAgent } from "@padhaaku/core";

function citations(request: AgentRequest): string[] {
  return request.retrieval.chunks.map((c) => c.id);
}

function buildGroundedOfflineReply(request: AgentRequest): string {
  const { topicLabel, chunks } = request.retrieval;
  const modelAnswer = chunks.find((c) => c.type === "model_answer");
  const concepts = chunks.filter((c) => c.type === "concept");

  if (!modelAnswer && concepts.length === 0) {
    return [
      `## ${topicLabel}`,
      "",
      "I don't have seeded material for this topic yet. Try photosynthesis, gravity, the water cycle, or the human heart.",
      "",
      "_Padhaaku is running in offline mode with Hybrid RAG._",
    ].join("\n");
  }

  return [
    `## ${topicLabel}`,
    "",
    "**Quick definition**",
    modelAnswer?.text ?? `${topicLabel} is a concept worth breaking into smaller ideas.`,
    "",
    concepts.length
      ? `**Key ideas to explore**\n${concepts.map((c, i) => `${i + 1}. ${c.metadata.label ?? c.text} — ${c.metadata.hint ?? ""}`).join("\n")}`
      : "",
    "",
    "**Try this next**",
    `- Ask me to quiz you on ${topicLabel}.`,
    `- Switch to [Learn mode](/learn) and explain ${topicLabel} in your own words.`,
    "",
    "_Grounded by Hybrid RAG retrieval. Add OPENAI_API_KEY for richer AI answers._",
  ]
    .filter(Boolean)
    .join("\n");
}

async function buildOpenAiReply(request: AgentRequest): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const grounded = request.retrieval.chunks
    .map((c) => `- [${c.type}] ${c.text}`)
    .join("\n");

  const messages = [
    {
      role: "system" as const,
      content: `You are Padhaaku, a patient study buddy. Explain topics clearly with short sections: definition, key ideas, a simple example, and one practice question. Use markdown. Keep answers concise.

Ground your answer in these retrieved facts when available:
${grounded || "(no retrieved context)"}

If retrieval is thin, be honest and scaffold the learner's thinking.`,
    },
    ...(request.history ?? []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: request.userText ?? request.topic },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("OpenAI returned an empty response");
  return reply;
}

export const explainerAgent: PadhaakuAgent = {
  name: "explainer",
  async run(request): Promise<AgentResponse> {
    if (process.env.OPENAI_API_KEY) {
      try {
        const reply = await buildOpenAiReply(request);
        return {
          agent: "explainer",
          provider: "openai",
          payload: { reply, mode: "openai" },
          citations: citations(request),
        };
      } catch {
        // fall through to offline
      }
    }

    return {
      agent: "explainer",
      provider: "offline",
      payload: { reply: buildGroundedOfflineReply(request), mode: "offline" },
      citations: citations(request),
    };
  },
};
