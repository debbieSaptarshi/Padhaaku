import type { AgentRequest, AgentResponse, FeedbackItem, PadhaakuAgent } from "@padhaaku/core";
import { GENERIC_FOLLOWUPS } from "@padhaaku/knowledge";

function normalize(s: string): string {
  return (s || "").toLowerCase().replace(/\s+/g, " ");
}

function nodeMatching(
  nodes: AgentRequest["nodes"],
  keywords: string[],
): string | null {
  if (!nodes?.length) return null;
  for (const node of nodes) {
    const txt = normalize(node.text);
    if (!txt) continue;
    if (keywords.some((k) => txt.includes(k.toLowerCase()))) return node.id;
  }
  return null;
}

function spanFor(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const k of keywords) {
    const idx = lower.indexOf(k.toLowerCase());
    if (idx !== -1) return text.slice(idx, idx + k.length);
  }
  return null;
}

function summaryFor(score: number, items: FeedbackItem[]): string {
  const misconceptions = items.filter((i) => i.kind === "misconception").length;
  const missing = items.filter((i) => i.kind === "missing").length;

  if (score >= 85) {
    return "Excellent — your understanding is strong and mostly accurate. Let's deepen it a little more.";
  }
  if (score >= 60) {
    let s = "Good progress! You've got the core idea.";
    if (misconceptions) s += " Watch out for the flagged misconception below.";
    if (missing) s += " A couple of key pieces are still missing.";
    return s;
  }
  if (score >= 30) {
    return "You're on the right track, but there are some gaps. Let's fill them in together.";
  }
  return "Let's build this up. Start with what you do know, and I'll nudge you step by step.";
}

export const analyzerAgent: PadhaakuAgent = {
  name: "analyzer",
  async run(request): Promise<AgentResponse> {
    const cleanText = (request.userText ?? "").trim();
    const lower = normalize(cleanText);
    const concepts = request.retrieval.chunks.filter((c) => c.type === "concept");
    const misconceptions = request.retrieval.chunks.filter((c) => c.type === "misconception");
    const modelAnswer =
      request.retrieval.chunks.find((c) => c.type === "model_answer")?.text ?? "";

    if (concepts.length > 0) {
      const items: FeedbackItem[] = [];
      let gotImportance = 0;
      let totalImportance = 0;

      for (const c of concepts) {
        totalImportance += c.importance;
        const present = c.keywords.some((k) => lower.includes(k.toLowerCase()));
        if (present) {
          gotImportance += c.importance;
          items.push({
            kind: "good",
            title: c.metadata.label ?? c.text,
            detail: `Nice — you included ${(c.metadata.label ?? c.text).toLowerCase()}.`,
            nodeId: nodeMatching(request.nodes, c.keywords),
            span: spanFor(cleanText, c.keywords),
          });
        }
      }

      const missing = concepts
        .filter((c) => !c.keywords.some((k) => lower.includes(k.toLowerCase())))
        .sort((a, b) => b.importance - a.importance);

      for (const c of missing) {
        items.push({
          kind: "missing",
          title: `Missing: ${c.metadata.label ?? c.text}`,
          detail: c.metadata.hint ?? `Try adding ${c.metadata.label ?? c.text}.`,
          nodeId: null,
          span: null,
        });
      }

      let penalty = 0;
      for (const m of misconceptions) {
        const hit = m.keywords.find((k) => lower.includes(k.toLowerCase()));
        if (hit) {
          penalty += 18;
          items.push({
            kind: "misconception",
            title: m.metadata.label ?? m.text,
            detail: m.metadata.correction ?? m.text,
            nodeId: nodeMatching(request.nodes, [hit]),
            span: spanFor(cleanText, [hit]),
          });
        }
      }

      let score = totalImportance
        ? Math.round((gotImportance / totalImportance) * 100)
        : 0;
      score = Math.max(0, Math.min(100, score - penalty));

      const order = { misconception: 0, missing: 1, incomplete: 2, good: 3 };
      items.sort((a, b) => order[a.kind] - order[b.kind]);

      const firstMissing = missing[0];
      const followUp = firstMissing
        ? `${firstMissing.metadata.hint} Can you add that to your explanation?`
        : "You've covered the essentials! Can you explain HOW these parts connect together?";

      return {
        agent: "analyzer",
        provider: "local",
        payload: {
          score,
          summary: summaryFor(score, items),
          items,
          followUp,
          modelAnswer: modelAnswer || request.retrieval.topicLabel,
        },
        citations: request.retrieval.chunks.map((c) => c.id),
      };
    }

    // Unknown topic — generic scaffolding
    const words = lower.split(/\s+/).filter(Boolean);
    const items: FeedbackItem[] = [];
    let score = 35;

    if (words.length === 0) {
      items.push({
        kind: "missing",
        title: "Nothing to review yet",
        detail: "Write or sketch what you think this is, then ask me to check it.",
        nodeId: null,
        span: null,
      });
      score = 0;
    } else {
      if (words.length >= 25) {
        score += 25;
        items.push({
          kind: "good",
          title: "Good detail",
          detail: "You wrote a substantial explanation — that's great for active recall.",
          nodeId: null,
          span: null,
        });
      } else {
        items.push({
          kind: "incomplete",
          title: "Add more detail",
          detail: "Try to expand your explanation — include the why and the how, not just the what.",
          nodeId: null,
          span: null,
        });
      }

      if (/\bbecause\b|\bso that\b|\bcauses?\b|\bdue to\b|\bresults? in\b/.test(lower)) {
        score += 20;
        items.push({
          kind: "good",
          title: "Cause & effect",
          detail: "You explained reasoning/causation — that shows real understanding.",
          nodeId: null,
          span: null,
        });
      } else {
        items.push({
          kind: "incomplete",
          title: "Explain the 'why'",
          detail: "Add a sentence explaining WHY this happens, using words like 'because' or 'so that'.",
          nodeId: null,
          span: null,
        });
      }

      if (request.nodes && request.nodes.length >= 3) {
        score += 15;
        items.push({
          kind: "good",
          title: "Nice mind map",
          detail: "Breaking the idea into connected nodes helps you see the structure.",
          nodeId: null,
          span: null,
        });
      }
    }

    score = Math.max(0, Math.min(90, score));
    const followUp = GENERIC_FOLLOWUPS[Math.floor(Math.random() * GENERIC_FOLLOWUPS.length)];

    return {
      agent: "analyzer",
      provider: "local",
      payload: {
        score,
        summary: summaryFor(score, items),
        items,
        followUp,
        modelAnswer:
          modelAnswer ||
          "A strong explanation usually covers: what it is, the key parts or steps, why it happens, and a real example.",
      },
      citations: request.retrieval.chunks.map((c) => c.id),
    };
  },
};
