export type StudyMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StudyBuddyResponse = {
  reply: string;
  mode: "offline" | "openai";
};

function extractTopic(question: string): string {
  const cleaned = question
    .replace(/^(what is|what are|explain|help me understand|tell me about)\s+/i, "")
    .replace(/\?+$/, "")
    .trim();

  return cleaned.length > 0 ? cleaned : question.trim();
}

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function buildOfflineStudyReply(question: string): string {
  const topic = titleCase(extractTopic(question));

  return [
    `## ${topic}`,
    "",
    "**Quick definition**",
    `${topic} is a concept worth breaking into smaller ideas. Start with what it *is*, what problem it solves, and where you might see it in practice.`,
    "",
    "**Key ideas to explore**",
    `1. Core idea — the single sentence you'd use to explain ${topic} to a friend.`,
    `2. Why it matters — what becomes easier once you understand ${topic}?`,
    `3. Common confusion — what do beginners often mix up about ${topic}?`,
    "",
    "**Mini example**",
    `Imagine you're teaching ${topic} using one concrete example from school, work, or daily life. That anchor makes abstract ideas stick.`,
    "",
    "**Try this next**",
    `- Write your own one-sentence definition of ${topic}.`,
    `- List two real-world places ${topic} shows up.`,
    `- Ask me a follow-up like "Give me an analogy for ${topic}" or "Quiz me on ${topic}".`,
    "",
    "_Padhaaku is running in offline mode. Add `OPENAI_API_KEY` to `.env.local` for richer AI answers._",
  ].join("\n");
}

async function buildOpenAiReply(
  question: string,
  history: StudyMessage[],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const messages = [
    {
      role: "system" as const,
      content:
        "You are Padhaaku, a patient study buddy. Explain topics clearly with short sections: definition, key ideas, a simple example, and one practice question. Use markdown. Keep answers concise but helpful.",
    },
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user" as const, content: question },
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
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("OpenAI returned an empty response");
  }

  return reply;
}

export async function getStudyBuddyReply(
  question: string,
  history: StudyMessage[] = [],
): Promise<StudyBuddyResponse> {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      reply: "Ask me about any topic — for example, \"What is photosynthesis?\" or \"Explain recursion simply.\"",
      mode: "offline",
    };
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const reply = await buildOpenAiReply(trimmed, history);
      return { reply, mode: "openai" };
    } catch {
      return {
        reply: `${buildOfflineStudyReply(trimmed)}\n\n_OpenAI was unavailable, so Padhaaku fell back to offline mode._`,
        mode: "offline",
      };
    }
  }

  return {
    reply: buildOfflineStudyReply(trimmed),
    mode: "offline",
  };
}
