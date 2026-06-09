import type { AgentRequest, AgentResponse, PadhaakuAgent } from "../../core/src/types";

function citationsFromRetrieval(request: AgentRequest): string[] {
  return request.retrieval.chunks.map((c) => c.id);
}

/** Agent 1 — Explainer (branch: dev-environment-setup-f6ee) */
export const explainerAgent: PadhaakuAgent = {
  name: "explainer",
  async run(request): Promise<AgentResponse> {
    const modelAnswer = request.retrieval.chunks.find((c) => c.type === "model_answer");
    const concepts = request.retrieval.chunks.filter((c) => c.type === "concept");

    const reply = modelAnswer
      ? [
          `## ${request.retrieval.topicLabel}`,
          "",
          modelAnswer.text,
          "",
          concepts.length
            ? `**Key ideas:** ${concepts.map((c) => c.metadata.label ?? c.text).join("; ")}`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : `I don't have enough material on "${request.topic}" yet. Try a seeded topic like photosynthesis or gravity.`;

    return {
      agent: "explainer",
      provider: "offline",
      payload: { reply, mode: "offline" },
      citations: citationsFromRetrieval(request),
    };
  },
};

/** Agent 2 — Socratic Feedback (branch: learning-canvas-a3cd, llm.mjs) */
export const socraticAgent: PadhaakuAgent = {
  name: "socratic",
  async run(request): Promise<AgentResponse> {
    // Phase 3: call OpenAI/Anthropic with retrieval-grounded SYSTEM_PROMPT from llm.mjs
    throw new Error("Socratic agent requires LLM — use analyzer fallback");
  },
};

/** Agent 3 — Concept Analyzer (branch: learning-canvas-a3cd, analyzer.mjs) */
export const analyzerAgent: PadhaakuAgent = {
  name: "analyzer",
  async run(request): Promise<AgentResponse> {
    const lower = (request.userText ?? "").toLowerCase();
    const concepts = request.retrieval.chunks.filter((c) => c.type === "concept");
    const misconceptions = request.retrieval.chunks.filter((c) => c.type === "misconception");

    const items = [];
    let gotImportance = 0;
    let totalImportance = 0;

    for (const c of concepts) {
      totalImportance += c.importance;
      const present = c.keywords.some((k) => lower.includes(k.toLowerCase()));
      if (present) {
        gotImportance += c.importance;
        items.push({
          kind: "good" as const,
          title: c.metadata.label ?? c.text,
          detail: `Nice — you included ${(c.metadata.label ?? c.text).toLowerCase()}.`,
          nodeId: null,
          span: null,
        });
      } else {
        items.push({
          kind: "missing" as const,
          title: `Missing: ${c.metadata.label ?? c.text}`,
          detail: c.metadata.hint ?? `Try adding ${c.metadata.label ?? c.text}.`,
          nodeId: null,
          span: null,
        });
      }
    }

    let penalty = 0;
    for (const m of misconceptions) {
      const hit = m.keywords.find((k) => lower.includes(k.toLowerCase()));
      if (hit) {
        penalty += 18;
        items.push({
          kind: "misconception" as const,
          title: m.metadata.label ?? m.text,
          detail: m.metadata.correction ?? m.text,
          nodeId: null,
          span: hit,
        });
      }
    }

    const score = Math.max(
      0,
      Math.min(100, Math.round((gotImportance / Math.max(totalImportance, 1)) * 100) - penalty),
    );

    const modelAnswer =
      request.retrieval.chunks.find((c) => c.type === "model_answer")?.text ??
      "Add more detail using the retrieved concepts above.";

    return {
      agent: "analyzer",
      provider: "local",
      payload: {
        score,
        summary:
          score >= 60
            ? "Good progress — Hybrid RAG grounded this review in the knowledge index."
            : "Let's build this up — check the missing pieces below.",
        items,
        followUp: "Can you connect these ideas and explain WHY, not just what?",
        modelAnswer,
      },
      citations: citationsFromRetrieval(request),
    };
  },
};

/** Agent 4 — Practice Coach (branch: recreate-fermi-expo-app-b6db) */
export const coachAgent: PadhaakuAgent = {
  name: "coach",
  async run(request): Promise<AgentResponse> {
    const questions = request.retrieval.chunks.filter((c) => c.type === "question");
    const top = questions[0];

    if (!top) {
      return {
        agent: "coach",
        provider: "local",
        payload: {},
        citations: [],
      };
    }

    const hints = request.retrieval.chunks
      .filter((c) => c.type === "hint" && c.topicId === top.topicId)
      .map((c) => c.text);

    return {
      agent: "coach",
      provider: "local",
      payload: {
        question: {
          id: top.id,
          conceptId: top.topicId,
          subject: top.metadata.subject ?? "General",
          difficulty: top.metadata.difficulty ?? 2,
          prompt: top.text,
          hints: hints.length ? hints : [top.metadata.hint ?? "Break the problem into smaller steps."],
          explanation:
            request.retrieval.chunks.find(
              (c) => c.type === "explanation" && c.topicId === top.topicId,
            )?.text ?? "",
        },
      },
      citations: [top.id, ...hints.map((_, i) => `hint-${i}`)],
    };
  },
};
