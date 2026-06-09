import { reciprocalRankFusion } from "../rag/fusion.mjs";
import { getKnowledgeStore } from "../rag/knowledge-store.mjs";

/**
 * Agent 2 — hybrid sparse + dense retrieval with RRF fusion.
 * @param {import("../rag/types.mjs").RouterResult} route
 * @param {import("../rag/types.mjs").FeedbackPayload} payload
 * @returns {Promise<import("../rag/types.mjs").RetrievalResult>}
 */
export async function retrieverAgent(route, payload) {
  const { sparse, vector } = getKnowledgeStore();
  const query = route.queries.join(" \n ");
  const opts = {
    topicId: route.topicId,
    types: route.chunkFilters.types,
    limit: 12,
  };

  const sparseHits = sparse.search(query, opts);
  let denseHits = [];
  let mode = "sparse";

  if (vector.hasProvider()) {
    try {
      denseHits = await vector.search(query, opts);
      if (denseHits.length) mode = "hybrid";
    } catch (err) {
      console.error("[retriever] dense search failed:", err.message);
    }
  }

  let chunks;
  if (sparseHits.length && denseHits.length) {
    chunks = reciprocalRankFusion(sparseHits, denseHits, { limit: 12 });
    mode = "hybrid";
  } else if (sparseHits.length) {
    chunks = sparseHits;
    mode = "sparse";
  } else if (denseHits.length) {
    chunks = denseHits;
    mode = "dense";
  } else {
    chunks = [];
    mode = "none";
  }

  // For known topics, ensure all concept + misconception chunks are in the candidate set.
  if (route.topicId) {
    const { chunks: allChunks } = getKnowledgeStore();
    const topicChunks = allChunks.filter(
      (c) =>
        c.topicId === route.topicId &&
        (c.type === "concept" || c.type === "misconception" || c.type === "model_answer")
    );
    const seen = new Set(chunks.map((h) => h.chunk.chunkId));
    for (const chunk of topicChunks) {
      if (!seen.has(chunk.chunkId)) {
        chunks.push({ chunk, score: 0.01, sparseScore: 0.01 });
      }
    }
    if (chunks.length && mode === "none") mode = "sparse";
  }

  // Boost misconception chunks when learner text is present (common tutoring need).
  if (payload.text?.trim()) {
    const learner = payload.text.toLowerCase();
    for (const hit of chunks) {
      if (hit.chunk.type !== "misconception") continue;
      const phrases = hit.chunk.matchPhrases || [];
      if (phrases.some((p) => learner.includes(p.toLowerCase()))) {
        hit.score += 0.15;
        hit.rrfScore = hit.score;
      }
    }
    chunks.sort((a, b) => b.score - a.score);
  }

  return { chunks, mode };
}
