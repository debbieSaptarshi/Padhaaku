function normalize(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ");
}

/**
 * @param {string} text
 * @param {string[]} keywords
 */
function spanFor(text, keywords) {
  const lower = text.toLowerCase();
  for (const k of keywords) {
    const needle = normalize(k);
    const idx = lower.indexOf(needle);
    if (idx !== -1) return text.slice(idx, idx + needle.length);
  }
  return null;
}

/**
 * @param {{ id: string, text: string }[]} nodes
 * @param {string[]} keywords
 */
function nodeMatching(nodes, keywords) {
  if (!nodes?.length) return null;
  for (const node of nodes) {
    const txt = normalize(node.text);
    if (!txt) continue;
    if (keywords.some((k) => txt.includes(normalize(k)))) return node.id;
  }
  return null;
}

/**
 * @param {object} result
 * @param {import("./types.mjs").FeedbackPayload} payload
 * @param {import("./types.mjs").HighlightIndex | null | undefined} highlightIndex
 */
export function enrichFeedbackItems(result, payload, highlightIndex) {
  if (!result?.items?.length || !highlightIndex) return result;

  const text = payload.text || "";
  const nodes = payload.nodes || [];

  const misconMap = new Map(highlightIndex.misconceptions.map((m) => [m.label, m]));
  const conceptMap = new Map(highlightIndex.concepts.map((c) => [c.label, c]));

  result.items = result.items.map((item) => {
    let span = item.span;
    let nodeId = item.nodeId;

    if (item.kind === "misconception") {
      const m = [...misconMap.values()].find((x) => item.title.includes(x.label) || x.label.includes(item.title));
      if (m) {
        if (!span) span = spanFor(text, m.match);
        if (!nodeId) nodeId = nodeMatching(nodes, m.match);
      }
    }

    if (item.kind === "good") {
      const c = [...conceptMap.values()].find((x) => item.title.includes(x.label) || x.label.includes(item.title));
      if (c) {
        if (!span) span = spanFor(text, c.keywords);
        if (!nodeId) nodeId = nodeMatching(nodes, c.keywords);
      }
    }

    if (span && !text.includes(span)) span = null;

    return { ...item, span, nodeId };
  });

  const order = { misconception: 0, missing: 1, incomplete: 2, good: 3 };
  result.items.sort((a, b) => order[a.kind] - order[b.kind]);

  return result;
}
