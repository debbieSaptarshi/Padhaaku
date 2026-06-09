const VALID_KINDS = new Set(["good", "incomplete", "misconception", "missing"]);
const MASTERY_THRESHOLD = 80;

export function clampScore(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function validateNodeIds(items, nodes) {
  const ids = new Set((nodes || []).map((n) => n.id));
  return items.map((item) => ({
    ...item,
    nodeId: item.nodeId && ids.has(item.nodeId) ? item.nodeId : null,
  }));
}

export function validateSpans(items, text) {
  const src = text || "";
  return items.map((item) => {
    if (!item.span) return { ...item, span: null };
    if (src.includes(item.span)) return item;
    return { ...item, span: null };
  });
}

export function buildSuggestedNodes(items) {
  return items
    .filter((i) => i.kind === "missing")
    .slice(0, 4)
    .map((i) => ({
      label: i.title.replace(/^Missing:\s*/i, ""),
      hint: i.detail,
    }));
}

export function computeMastery(score, items) {
  const misconceptions = items.filter((i) => i.kind === "misconception").length;
  const importantMissing = items.filter(
    (i) => i.kind === "missing" && !i.title.toLowerCase().includes("connect")
  ).length;
  const achieved =
    score >= MASTERY_THRESHOLD && misconceptions === 0 && importantMissing <= 1;
  return { achieved, threshold: MASTERY_THRESHOLD };
}

/**
 * Normalize analyzer/LLM output into the stable API contract.
 */
export function finalizeFeedback(raw, context = {}) {
  const {
    attemptNumber = 1,
    unlockModelAnswer = false,
    previousScore = null,
    text = "",
    nodes = [],
  } = context;

  const items = validateSpans(
    validateNodeIds(
      (Array.isArray(raw.items) ? raw.items : [])
        .filter((i) => i && VALID_KINDS.has(i.kind))
        .slice(0, 8)
        .map((i) => ({
          kind: i.kind,
          title: String(i.title || "").slice(0, 120),
          detail: String(i.detail || "").slice(0, 400),
          nodeId: i.nodeId ? String(i.nodeId) : null,
          span: i.span ? String(i.span) : null,
        })),
      nodes
    ),
    text
  );

  const score = clampScore(raw.score);
  const mastery = computeMastery(score, items);
  const suggestedNodes = buildSuggestedNodes(items);

  let modelAnswer = raw.modelAnswer ? String(raw.modelAnswer) : null;
  if (!unlockModelAnswer && attemptNumber < 2) {
    modelAnswer = null;
  }

  return {
    provider: raw.provider || "local",
    topicLabel: String(raw.topicLabel || context.topic || "Topic"),
    score,
    previousScore: previousScore != null ? clampScore(previousScore) : null,
    attemptNumber,
    summary: String(raw.summary || ""),
    items,
    followUp: String(raw.followUp || ""),
    modelAnswer,
    suggestedNodes,
    mastery,
  };
}

export { MASTERY_THRESHOLD };
