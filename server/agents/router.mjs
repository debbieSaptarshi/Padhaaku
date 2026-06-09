import { findTopic, TOPICS } from "../concepts.mjs";
import { getKnowledgeStore } from "../rag/knowledge-store.mjs";

function normalize(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function uniqueQueries(queries) {
  const seen = new Set();
  return queries
    .map((q) => q.trim())
    .filter((q) => {
      const key = q.toLowerCase();
      if (!q || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function resolveTopicId(topicText) {
  const lowered = normalize(topicText);
  for (const [id, entry] of Object.entries(TOPICS)) {
    if (entry.aliases.some((a) => lowered === a || lowered.includes(a) || a.includes(lowered))) {
      return { topicId: id, topicLabel: entry.label, confidence: "known" };
    }
  }
  return null;
}

/**
 * Agent 1 — resolve topic and shape retrieval queries.
 * @param {import("../rag/types.mjs").FeedbackPayload} payload
 * @returns {import("../rag/types.mjs").RouterResult}
 */
export function routerAgent(payload) {
  const topicText = (payload.topic || "").trim();
  const learnerText = (payload.text || "").trim();
  const nodeText = (payload.nodes || [])
    .map((n) => n.text)
    .filter(Boolean)
    .join(". ");

  let topicId = null;
  let topicLabel = topicText;
  let confidence = "unknown";

  const direct = resolveTopicId(topicText);
  if (direct) {
    topicId = direct.topicId;
    topicLabel = direct.topicLabel;
    confidence = direct.confidence;
  } else {
    const known = findTopic(topicText);
    if (known) {
      const match = Object.entries(TOPICS).find(([, entry]) => entry.label === known.label);
      if (match) {
        topicId = match[0];
        topicLabel = known.label;
        confidence = "known";
      }
    }
  }

  if (!topicId && learnerText) {
    const { sparse } = getKnowledgeStore();
    const hits = sparse.search(`${topicText}. ${learnerText}`, { types: ["topic_meta"], limit: 1 });
    if (hits.length && hits[0].score > 1.5) {
      topicId = hits[0].chunk.topicId;
      topicLabel = hits[0].chunk.topicLabel;
      confidence = "inferred";
    }
  }

  const queries = uniqueQueries([
    topicLabel,
    topicText,
    learnerText ? `${topicLabel}: ${learnerText.slice(0, 500)}` : "",
    nodeText ? `${topicLabel} mind map: ${nodeText.slice(0, 500)}` : "",
  ]);

  return {
    topicId,
    topicLabel,
    queries,
    chunkFilters: {
      types: ["concept", "misconception", "model_answer", "topic_meta"],
    },
    confidence,
  };
}
