import { findTopic, GENERIC_FOLLOWUPS } from "./concepts.mjs";
import { finalizeFeedback } from "./schema.mjs";

function normalize(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ");
}

function nodeMatching(nodes, keywords) {
  if (!nodes?.length) return null;
  for (const node of nodes) {
    const txt = normalize(node.text);
    if (!txt) continue;
    if (keywords.some((k) => txt.includes(normalize(k)))) return node;
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

function nodesConnected(edges, fromNode, toNode) {
  if (!fromNode || !toNode || !edges?.length) return false;
  return edges.some(
    (e) =>
      (e.from === fromNode.id && e.to === toNode.id) ||
      (e.from === toNode.id && e.to === fromNode.id)
  );
}

function wordCount(text, nodes) {
  const nodeWords = (nodes || [])
    .map((n) => n.text || "")
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  const textWords = (text || "").split(/\s+/).filter(Boolean).length;
  return textWords + nodeWords;
}

function checkRequiredEdges(entry, nodes, edges, items) {
  for (const req of entry.requiredEdges || []) {
    const fromNode = nodeMatching(nodes, req.fromKeywords);
    const toNode = nodeMatching(nodes, req.toKeywords);
    if (fromNode && toNode && !nodesConnected(edges, fromNode, toNode)) {
      items.push({
        kind: "incomplete",
        title: `Connect: ${req.label}`,
        detail: `You mentioned both ideas — try drawing a connection between "${fromNode.text}" and "${toNode.text}".`,
        nodeId: fromNode.id,
        span: null,
      });
    }
  }
}

function analyzeKnownTopic(entry, { text, nodes, edges }) {
  const cleanText = (text || "").trim();
  const lower = normalize(cleanText);
  const items = [];
  let gotImportance = 0;
  let totalImportance = 0;

  for (const c of entry.concepts) {
    totalImportance += c.importance;
    const present = c.keywords.some((k) => lower.includes(normalize(k)));
    if (present) {
      gotImportance += c.importance;
      const node = nodeMatching(nodes, c.keywords);
      items.push({
        kind: "good",
        title: c.label,
        detail: `Nice — you included ${c.label.toLowerCase()}.`,
        nodeId: node ? node.id : null,
        span: spanFor(cleanText, c.keywords),
      });
    }
  }

  const missing = entry.concepts
    .filter((c) => !c.keywords.some((k) => lower.includes(normalize(k))))
    .sort((a, b) => b.importance - a.importance);

  for (const c of missing) {
    items.push({
      kind: "missing",
      title: `Missing: ${c.label}`,
      detail: c.hint,
      nodeId: null,
      span: null,
    });
  }

  let penalty = 0;
  for (const m of entry.misconceptions) {
    const hit = m.match.find((phrase) => lower.includes(normalize(phrase)));
    if (hit) {
      penalty += 18;
      const node = nodeMatching(nodes, [hit]);
      items.push({
        kind: "misconception",
        title: m.label,
        detail: m.correction,
        nodeId: node ? node.id : null,
        span: spanFor(cleanText, [hit]),
      });
    }
  }

  checkRequiredEdges(entry, nodes, edges, items);
  const edgePenalty = items.filter((i) => i.kind === "incomplete").length * 8;
  penalty += edgePenalty;

  let score = totalImportance
    ? Math.round((gotImportance / totalImportance) * 100)
    : 0;
  score = Math.max(0, Math.min(100, score - penalty));

  const order = { misconception: 0, missing: 1, incomplete: 2, good: 3 };
  items.sort((a, b) => order[a.kind] - order[b.kind]);

  const firstMissing = missing[0];
  const followUp = firstMissing
    ? `${firstMissing.hint} Can you add that to your explanation?`
    : "You've covered the essentials! Can you explain HOW these parts connect together?";

  return {
    provider: "local",
    topicLabel: entry.label,
    score,
    summary: summaryFor(score, items),
    items,
    followUp,
    modelAnswer: entry.modelAnswer,
  };
}

function analyzeUnknownTopic({ topic, text, nodes }) {
  const lower = normalize(text);
  const words = lower.split(/\s+/).filter(Boolean);
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
    score = 0;
  } else {
    if (words.length >= 25) {
      score += 25;
      items.push({
        kind: "good",
        title: "Good detail",
        detail: "You wrote a substantial explanation — great for active recall.",
        nodeId: null,
        span: null,
      });
    } else {
      items.push({
        kind: "incomplete",
        title: "Add more detail",
        detail: "Expand your explanation — include the why and how, not just the what.",
        nodeId: null,
        span: null,
      });
    }

    if (/\bbecause\b|\bso that\b|\bcauses?\b|\bdue to\b|\bresults? in\b/.test(lower)) {
      score += 20;
      items.push({
        kind: "good",
        title: "Cause & effect",
        detail: "You explained reasoning — that shows real understanding.",
        nodeId: null,
        span: null,
      });
    } else {
      items.push({
        kind: "incomplete",
        title: "Explain the 'why'",
        detail: "Add a sentence explaining WHY, using words like 'because' or 'so that'.",
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
  }

  score = Math.max(0, Math.min(90, score));
  const followUp =
    GENERIC_FOLLOWUPS[Math.floor(Math.random() * GENERIC_FOLLOWUPS.length)];

  return {
    provider: "local",
    topicLabel: topic,
    score,
    summary: summaryFor(score, items),
    items,
    followUp,
    modelAnswer:
      "A strong explanation usually covers: what it is, key parts, why it happens, and a real example. Add an API key for detailed AI feedback on any topic.",
  };
}

export function analyzeLocally(payload) {
  const { topic, text, nodes, edges, attemptNumber, unlockModelAnswer, previousScore } =
    payload;

  const wc = wordCount(text, nodes);
  if (wc < 8 && attemptNumber === 1 && !unlockModelAnswer) {
    return finalizeFeedback(
      {
        provider: "local",
        topicLabel: topic,
        score: 0,
        summary: "Add a bit more before I can review — even a few ideas on the canvas helps.",
        items: [
          {
            kind: "incomplete",
            title: "Keep going",
            detail: "Drop a few concept nodes or write a couple of sentences, then check again.",
            nodeId: null,
            span: null,
          },
        ],
        followUp: "What's the first thing that comes to mind about this topic?",
        modelAnswer: null,
      },
      { attemptNumber, unlockModelAnswer, previousScore, text, nodes, topic }
    );
  }

  const entry = findTopic(topic);
  const raw = entry
    ? analyzeKnownTopic(entry, { text, nodes, edges })
    : analyzeUnknownTopic({ topic, text, nodes });

  return finalizeFeedback(raw, {
    attemptNumber,
    unlockModelAnswer,
    previousScore,
    text,
    nodes,
    topic,
  });
}

function summaryFor(score, items) {
  const misconceptions = items.filter((i) => i.kind === "misconception").length;
  const missing = items.filter((i) => i.kind === "missing").length;

  if (score >= 85) {
    return "Excellent — your understanding is strong. Let's deepen it a little more.";
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
