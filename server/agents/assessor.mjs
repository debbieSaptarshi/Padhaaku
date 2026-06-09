import { GENERIC_FOLLOWUPS } from "../concepts.mjs";

function normalize(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ");
}

function nodeMatching(nodes, keywords) {
  if (!nodes?.length) return null;
  for (const node of nodes) {
    const txt = normalize(node.text);
    if (!txt) continue;
    if (keywords.some((k) => txt.includes(k))) return node;
  }
  return null;
}

function spanFor(text, keywords) {
  const lower = text.toLowerCase();
  for (const k of keywords) {
    const idx = lower.indexOf(k.toLowerCase());
    if (idx !== -1) return text.slice(idx, idx + k.length);
  }
  return null;
}

function summaryFor(score, items) {
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

function genericAssessment({ topic, text, nodes }) {
  const lower = normalize(text);
  const words = lower.split(/\s+/).filter(Boolean);
  /** @type {import("../rag/types.mjs").FeedbackItem[]} */
  const items = [];
  let score = 35;

  if (words.length === 0) {
    items.push({
      kind: "missing",
      title: "Nothing to review yet",
      detail: "Write or sketch what you think this is, then ask me to check it.",
      nodeId: null,
      span: null,
    });
    return { score: 0, items, topicLabel: topic };
  }

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

  if (nodes?.length >= 3) {
    score += 15;
    items.push({
      kind: "good",
      title: "Nice mind map",
      detail: "Breaking the idea into connected nodes helps you see the structure.",
      nodeId: null,
      span: null,
    });
  }

  return { score: Math.max(0, Math.min(90, score)), items, topicLabel: topic };
}

/**
 * Agent 3 — grade learner explanation against retrieved context.
 * @param {import("../rag/types.mjs").FeedbackPayload} payload
 * @param {import("../rag/types.mjs").RetrievalResult} retrieval
 * @param {import("../rag/types.mjs").RouterResult} route
 * @returns {import("../rag/types.mjs").AssessmentResult}
 */
export function assessorAgent(payload, retrieval, route) {
  const cleanText = (payload.text || "").trim();
  const lower = normalize(cleanText);
  const conceptChunks = retrieval.chunks.filter((h) => h.chunk.type === "concept");
  const misconceptionChunks = retrieval.chunks.filter((h) => h.chunk.type === "misconception");

  if (!conceptChunks.length && route.confidence === "unknown") {
    const generic = genericAssessment(payload);
    return {
      score: generic.score,
      items: generic.items,
      topicLabel: route.topicLabel,
    };
  }

  /** @type {import("../rag/types.mjs").FeedbackItem[]} */
  const items = [];
  let gotImportance = 0;
  let totalImportance = 0;

  for (const hit of conceptChunks) {
    const c = hit.chunk;
    const importance = c.importance ?? 1;
    totalImportance += importance;
    const keywords = c.keywords?.length ? c.keywords : tokenize(c.title);
    const present = keywords.some((k) => lower.includes(k.toLowerCase()));

    if (present) {
      gotImportance += importance;
      const node = nodeMatching(payload.nodes, keywords);
      items.push({
        kind: "good",
        title: c.title,
        detail: `Nice — you included ${c.title.toLowerCase()}.`,
        nodeId: node ? node.id : null,
        span: spanFor(cleanText, keywords),
        source: c.chunkId,
      });
    }
  }

  const missingConcepts = conceptChunks
    .filter((hit) => {
      const keywords = hit.chunk.keywords?.length ? hit.chunk.keywords : tokenize(hit.chunk.title);
      return !keywords.some((k) => lower.includes(k.toLowerCase()));
    })
    .sort((a, b) => (b.chunk.importance ?? 1) - (a.chunk.importance ?? 1));

  for (const hit of missingConcepts) {
    const c = hit.chunk;
    items.push({
      kind: "missing",
      title: `Missing: ${c.title}`,
      detail: c.hint || `Try to explain ${c.title.toLowerCase()}.`,
      nodeId: null,
      span: null,
      source: c.chunkId,
    });
  }

  let penalty = 0;
  for (const hit of misconceptionChunks) {
    const m = hit.chunk;
    const phrases = m.matchPhrases || m.keywords || [];
    const matched = phrases.find((phrase) => lower.includes(normalize(phrase)));
    if (matched) {
      penalty += 18;
      const node = nodeMatching(payload.nodes, [matched]);
      items.push({
        kind: "misconception",
        title: m.title,
        detail: m.correction || m.body,
        nodeId: node ? node.id : null,
        span: spanFor(cleanText, [matched]),
        source: m.chunkId,
      });
    }
  }

  let score = totalImportance ? Math.round((gotImportance / totalImportance) * 100) : 0;
  score = Math.max(0, Math.min(100, score - penalty));

  const order = { misconception: 0, missing: 1, incomplete: 2, good: 3 };
  items.sort((a, b) => order[a.kind] - order[b.kind]);

  return {
    score,
    items,
    topicLabel: route.topicLabel,
  };
}

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export { summaryFor, GENERIC_FOLLOWUPS };
