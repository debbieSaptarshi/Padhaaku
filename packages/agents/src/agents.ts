import type {
  AgentRequest,
  AgentResponse,
  FeedbackItem,
  PadhaakuAgent,
} from "@padhaaku/core";
import { assessWithLlm, explainWithLlm, hasLlm, llmProvider } from "@padhaaku/llm";

function citationsFromRetrieval(request: AgentRequest): string[] {
  return request.retrieval.chunks.map((chunk) => chunk.id);
}

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Agent 1 — Explainer (branch: dev-environment-setup-f6ee) */
export const explainerAgent: PadhaakuAgent = {
  name: "explainer",
  async run(request): Promise<AgentResponse> {
    const modelAnswer = request.retrieval.chunks.find((c) => c.type === "model_answer");
    const concepts = request.retrieval.chunks.filter((c) => c.type === "concept");
    const question = request.userText ?? request.topic;

    if (hasLlm()) {
      try {
        const reply = await explainWithLlm({
          question,
          history: request.history ?? [],
          topicLabel: request.retrieval.topicLabel,
          contextChunks: request.retrieval.chunks,
        });
        return {
          agent: "explainer",
          provider: llmProvider() ?? "openai",
          payload: { reply, mode: llmProvider() ?? "openai" },
          citations: citationsFromRetrieval(request),
        };
      } catch {
        // fall through to offline grounded reply
      }
    }

    const topicLabel = titleCase(request.retrieval.topicLabel || request.topic);
    const reply = modelAnswer
      ? [
          `## ${topicLabel}`,
          "",
          "**Quick definition**",
          modelAnswer.text,
          "",
          concepts.length
            ? `**Key ideas:**\n${concepts.map((c) => `- ${c.metadata.label ?? c.text}`).join("\n")}`
            : "",
          "",
          "**Try this next**",
          `- Ask me to quiz you on ${topicLabel}.`,
          `- Explain ${topicLabel} in your own words on the learning canvas.`,
          "",
          request.retrieval.chunks.length
            ? "_Grounded in Padhaaku's Hybrid RAG knowledge index (offline mode)._"
            : `_I don't have enough material on "${request.topic}" yet. Try photosynthesis, gravity, or the water cycle._`,
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

/** Agent 2 — Socratic Feedback (branch: learning-canvas-a3cd) */
export const socraticAgent: PadhaakuAgent = {
  name: "socratic",
  async run(request): Promise<AgentResponse> {
    if (!hasLlm()) {
      throw new Error("Socratic agent requires LLM — use analyzer fallback");
    }

    const parsed = await assessWithLlm({
      topic: request.topic,
      userText: request.userText ?? "",
      nodes: request.nodes ?? [],
      contextChunks: request.retrieval.chunks,
    });

    const items = Array.isArray(parsed.items)
      ? (parsed.items as FeedbackItem[]).map((item) => ({
          kind: ["good", "incomplete", "misconception", "missing"].includes(item.kind)
            ? item.kind
            : ("incomplete" as const),
          title: String(item.title ?? ""),
          detail: String(item.detail ?? ""),
          nodeId: item.nodeId ? String(item.nodeId) : null,
          span: item.span ? String(item.span) : null,
        }))
      : [];

    return {
      agent: "socratic",
      provider: llmProvider() ?? "openai",
      payload: {
        score: clampScore(parsed.score),
        summary: String(parsed.summary ?? ""),
        items,
        followUp: String(parsed.followUp ?? "Can you explain WHY, not just what?"),
        modelAnswer: String(
          parsed.modelAnswer ??
            request.retrieval.chunks.find((c) => c.type === "model_answer")?.text ??
            "",
        ),
      },
      citations: citationsFromRetrieval(request),
    };
  },
};

/** Agent 3 — Concept Analyzer (branch: learning-canvas-a3cd) */
export const analyzerAgent: PadhaakuAgent = {
  name: "analyzer",
  async run(request): Promise<AgentResponse> {
    const lower = (request.userText ?? "").toLowerCase();
    const concepts = request.retrieval.chunks.filter((c) => c.type === "concept");
    const misconceptions = request.retrieval.chunks.filter((c) => c.type === "misconception");

    const items: FeedbackItem[] = [];
    let gotImportance = 0;
    let totalImportance = 0;

    for (const concept of concepts) {
      totalImportance += concept.importance;
      const present = concept.keywords.some((keyword) =>
        lower.includes(keyword.toLowerCase()),
      );
      if (present) {
        gotImportance += concept.importance;
        items.push({
          kind: "good",
          title: concept.metadata.label ?? concept.text,
          detail: `Nice — you included ${(concept.metadata.label ?? concept.text).toLowerCase()}.`,
          nodeId: null,
          span: null,
        });
      } else {
        items.push({
          kind: "missing",
          title: `Missing: ${concept.metadata.label ?? concept.text}`,
          detail: concept.metadata.hint ?? `Try adding ${concept.metadata.label ?? concept.text}.`,
          nodeId: null,
          span: null,
        });
      }
    }

    let penalty = 0;
    for (const misconception of misconceptions) {
      const hit = misconception.keywords.find((keyword) =>
        lower.includes(keyword.toLowerCase()),
      );
      if (hit) {
        penalty += 18;
        items.push({
          kind: "misconception",
          title: misconception.metadata.label ?? misconception.text,
          detail: misconception.metadata.correction ?? misconception.text,
          nodeId: null,
          span: hit,
        });
      }
    }

    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round((gotImportance / Math.max(totalImportance, 1)) * 100) - penalty,
      ),
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
    const mastery = request.mastery ?? {};

    let top = questions[0];
    if (request.questionId) {
      top = questions.find((q) => q.id === request.questionId) ?? top;
    } else {
      const ranked = [...questions].sort((a, b) => {
        const aScore = mastery[a.topicId] ?? 5;
        const bScore = mastery[b.topicId] ?? 5;
        return aScore - bScore;
      });
      top = ranked[0];
    }

    if (!top) {
      return {
        agent: "coach",
        provider: "local",
        payload: {},
        citations: [],
      };
    }

    const hints = request.retrieval.chunks
      .filter((c) => c.type === "hint" && c.id.startsWith(top.id))
      .map((c) => c.text);

    const isMC = top.metadata.questionType === "multiple_choice";

    const buildQuestion = () => {
      const base = {
        id: top.id,
        conceptId: top.topicId,
        subject: top.metadata.subject ?? "General",
        difficulty: top.metadata.difficulty ?? 2,
        prompt: top.text,
        hints,
        explanation:
          request.retrieval.chunks.find(
            (c) => c.type === "explanation" && c.id === `${top.id}:explanation`,
          )?.text ?? "",
        focusPoint: top.metadata.focusPoint,
      };
      if (isMC) {
        return {
          ...base,
          type: "multiple_choice" as const,
          choices: top.metadata.choices ?? [],
          correctChoiceId: top.metadata.correctChoiceId ?? "",
          choiceRationale: top.metadata.choiceRationale,
        };
      }
      return {
        ...base,
        type: "open_ended" as const,
        answerKeywords: top.metadata.answerKeywords ?? top.keywords,
      };
    };

    if (request.intent === "hint") {
      const hintIndex = Math.min(
        hints.length - 1,
        Math.max(0, Number(request.userText ?? "0") || 0),
      );
      return {
        agent: "coach",
        provider: "local",
        payload: {
          question: buildQuestion(),
          score: undefined,
          masteryDelta: undefined,
        },
        citations: [top.id],
      };
    }

    if (isMC && request.selectedChoiceId) {
      const correct = request.selectedChoiceId === top.metadata.correctChoiceId;
      const rawScore = correct ? 9 : 3;
      const masteryDelta = correct ? 0.4 : -0.2;
      const rationale = top.metadata.choiceRationale?.[request.selectedChoiceId] ?? "";

      return {
        agent: "coach",
        provider: "local",
        payload: {
          question: buildQuestion(),
          score: rawScore,
          masteryDelta,
          correct,
          correctChoiceId: top.metadata.correctChoiceId,
          rationale,
        },
        citations: [top.id],
      };
    }

    const responseText = (request.userText ?? "").toLowerCase();
    const keywords = top.metadata.answerKeywords ?? top.keywords;
    const matches = keywords.filter((keyword) =>
      responseText.includes(keyword.toLowerCase()),
    );
    const rawScore =
      matches.length === 0
        ? 2
        : Math.max(4, Math.min(10, Math.round((matches.length / keywords.length) * 10)));
    const masteryDelta = rawScore >= 7 ? 0.4 : rawScore >= 5 ? 0.1 : -0.2;

    return {
      agent: "coach",
      provider: "local",
      payload: {
        question: buildQuestion(),
        score: rawScore,
        masteryDelta,
      },
      citations: [top.id, ...hints.map((_, index) => `${top.id}:hint:${index}`)],
    };
  },
};

function clampScore(value: unknown): number {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}
