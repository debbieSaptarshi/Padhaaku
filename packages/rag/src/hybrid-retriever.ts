import type { HybridRetriever, KnowledgeChunk, KnowledgeStore } from "@padhaaku/core";
import { denseSearch } from "./dense.js";
import { reciprocalRankFusion, topChunksByFusion } from "./fusion.js";
import { sparseSearch } from "./sparse.js";

export type { KnowledgeStore };

/**
 * Hybrid retriever: sparse + dense (stub) + graph → RRF fusion.
 * Dense channel returns [] until Phase 2 embedding index is wired.
 */
export function createHybridRetriever(store: KnowledgeStore): HybridRetriever {
  return {
    async retrieve({ topic, query, intent, mastery }) {
      const topicId = store.findTopicId(topic);
      const allChunks = store.getAllChunks();

      const sparseIds = sparseSearch(allChunks, `${topic} ${query}`);
      const denseIds = denseSearch(allChunks, `${topic} ${query}`);

      const graphNeighbors = topicId ? store.getGraphNeighbors(topicId) : [];
      const graphIds = topicId
        ? store
            .getChunksByTopic(topicId)
            .filter((c) => c.type === "concept" || c.type === "misconception")
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 10)
            .map((c) => c.id)
        : [];

      const fusionScores = reciprocalRankFusion([
        { source: "sparse", ids: sparseIds },
        { source: "dense", ids: denseIds },
        { source: "graph", ids: graphIds },
      ]);

      // Practice intent: boost question/hint chunks for weak mastery concepts
      if (intent === "practice" || intent === "hint") {
        for (const chunk of allChunks) {
          if (chunk.type !== "question" && chunk.type !== "hint") continue;
          const masteryScore = mastery?.[chunk.topicId] ?? 5;
          if (masteryScore < 6) {
            fusionScores[chunk.id] = (fusionScores[chunk.id] ?? 0) + (6 - masteryScore) * 0.05;
          }
        }
      }

      const candidateIds = new Set([
        ...sparseIds,
        ...denseIds,
        ...graphIds,
        ...allChunks.filter((c) => c.topicId === topicId).map((c) => c.id),
      ]);

      const candidates = allChunks.filter((c) => candidateIds.has(c.id));
      const topK = Number(process.env.RAG_TOP_K ?? 8);
      const chunks = topChunksByFusion(candidates, fusionScores, topK);

      const topicLabel = store.getTopicLabel
        ? store.getTopicLabel(topicId, topic)
        : chunks.find((c) => c.topicId === topicId)?.metadata.label ?? topic;

      return {
        topicId,
        topicLabel,
        chunks,
        fusionScores,
        graphNeighbors,
      };
    },
  };
}
