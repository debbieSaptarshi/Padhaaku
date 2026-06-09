import type { HybridRetriever } from "../../core/src/orchestrator";
import type { KnowledgeChunk, RetrievalContext } from "../../core/src/types";
import { reciprocalRankFusion, topChunksByFusion } from "./fusion";
import { sparseSearch } from "./sparse";

export type KnowledgeStore = {
  getAllChunks(): KnowledgeChunk[];
  getChunksByTopic(topicId: string): KnowledgeChunk[];
  findTopicId(topic: string): string | null;
  getGraphNeighbors(topicId: string): string[];
};

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

      // Phase 2: replace with vector similarity search
      const denseIds: string[] = [];

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

      const topicLabel =
        chunks.find((c) => c.topicId === topicId)?.metadata.label ?? topic;

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
