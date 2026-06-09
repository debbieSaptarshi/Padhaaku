import { findTopic, GENERIC_FOLLOWUPS } from "./concepts.mjs";
import { handwritingNudges, strokeMetrics } from "./handwriting.mjs";

function normalize(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ");
}

function nodeMatching(nodes, keywords) {
  if (!nodes || !nodes.length) return null;
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
    const idx = lower.indexOf(k);
    if (idx !== -1) return text.slice(idx, idx + k.length);
  }
  return null;
}

function pickFollowUp(entry, attemptNumber) {
  const pool = entry.followUpPool?.length
    ? entry.followUpPool
    : entry.concepts.map((c) => c.hint).filter(Boolean);
  if (!pool.length) return "Can you connect the key ideas together?";
  return pool[(Math.max(1, attemptNumber) - 1) % pool.length];
}

function analyzeOrphans(nodes, edges) {
  if (!nodes?.length) return [];
  const connected = new Set();
  for (const e of edges || []) {
    connected.add(e.from);
    connected.add(e.to);
  }
  return nodes.filter((n) => n.text?.trim() && !connected.has(n.id));
}

export function analyzeLocally(payload) {
  const { topic, text, nodes, edges, strokes, mode, attemptNumber = 1 } = payload;
  const cleanText = (text || "").trim();
  const lower = normalize(cleanText);
  const entry = findTopic(topic);
  const hwItems = handwritingNudges({
    strokes,
    caption: cleanText,
    mode,
  });

  if (entry) {
    const items = [...hwItems];
    let gotImportance = 0;
    let totalImportance = 0;

    for (const c of entry.concepts) {
      totalImportance += c.importance;
      const present = c.keywords.some((k) => lower.includes(k));
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
      .filter((c) => !c.keywords.some((k) => lower.includes(k)))
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

    const orphans = analyzeOrphans(nodes, edges);
    for (const n of orphans.slice(0, 2)) {
      items.push({
        kind: "incomplete",
        title: `Connect "${n.text.slice(0, 40)}"`,
        detail: "This idea is on the canvas but not linked to others — how does it fit?",
        nodeId: n.id,
        span: null,
      });
    }

    let score = totalImportance
      ? Math.round((gotImportance / totalImportance) * 100)
      : 0;
    score = Math.max(0, Math.min(100, score - penalty));

    if (mode === "handwriting") {
      const m = strokeMetrics(strokes);
      if (m.substantial) score = Math.min(100, score + 8);
    }

    const order = { misconception: 0, missing: 1, incomplete: 2, good: 3 };
    items.sort((a, b) => order[a.kind] - order[b.kind]);

    const firstMissing = missing[0];
    const followUp = firstMissing
      ? `${firstMissing.hint} Can you add that to your explanation?`
      : pickFollowUp(entry, attemptNumber);

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

  const words = lower.split(/\s+/).filter(Boolean);
  const items = [...hwItems];
  let score = 35;

  if (words.length === 0 && mode !== "handwriting") {
    items.push({
      kind: "missing",
      title: "Nothing to review yet",
      detail: "Write or sketch what you think this is, then ask me to check it.",
      nodeId: null,
      span: null,
    });
    score = 0;
  } else if (words.length === 0 && mode === "handwriting") {
    const m = strokeMetrics(strokes);
    score = m.substantial ? 40 : 5;
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

    if (nodes && nodes.length >= 3) {
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

  if (mode === "handwriting") {
    const m = strokeMetrics(strokes);
    if (m.substantial) score = Math.min(90, score + 12);
  }

  score = Math.max(0, Math.min(90, score));
  const followUp =
    GENERIC_FOLLOWUPS[(Math.max(1, attemptNumber) - 1) % GENERIC_FOLLOWUPS.length];

  return {
    provider: "local",
    topicLabel: topic,
    score,
    summary: summaryFor(score, items),
    items,
    followUp,
    modelAnswer:
      "A strong explanation usually covers: what it is, the key parts or steps, why it happens, and a real example. Add an OpenAI/Anthropic API key to unlock detailed AI feedback on any topic.",
  };
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
