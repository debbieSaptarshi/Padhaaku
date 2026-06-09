import type { HybridRetriever } from "@padhaaku/core";
import type { KnowledgeStore } from "@padhaaku/knowledge";
import { reciprocalRankFusion, topChunksByFusion } from "./fusion";
import { sparseSearch } from "./sparse";

/**
 * Hybrid retriever: sparse + dense (stub) + graph → RRF fusion.
 * Dense channel activates when PINECONE_API_KEY is set (Phase 2).
 */
export function createHybridRetriever(store: KnowledgeStore): HybridRetriever {
  return {
    async retrieve({ topic, query, intent, mastery }) {
      const topicId = store.findTopicId(topic);
      const allChunks = store.getAllChunks();

      const sparseIds = sparseSearch(allChunks, `${topic} ${query}`);
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

      const candidateIds = new Set<string>([
        ...sparseIds,
        ...denseIds,
        ...graphIds,
        ...allChunks.filter((c) => topicId && c.topicId === topicId).map((c) => c.id),
      ]);

      if (intent === "practice" || intent === "hint") {
        const questions = allChunks.filter((c) => c.type === "question");
        let bestQuestionId: string | null = null;
        let bestScore = -1;

        for (const chunk of questions) {
          const masteryScore = mastery?.[chunk.topicId] ?? 5;
          const boost = (10 - masteryScore) * 0.08;
          fusionScores[chunk.id] = (fusionScores[chunk.id] ?? 0) + boost;
          candidateIds.add(chunk.id);

          if (fusionScores[chunk.id] > bestScore) {
            bestScore = fusionScores[chunk.id];
            bestQuestionId = chunk.id;
          }
        }

        if (bestQuestionId) {
          const q = questions.find((c) => c.id === bestQuestionId);
          if (q) {
            for (const chunk of allChunks) {
              if (
                chunk.topicId === q.topicId &&
                (chunk.type === "hint" || chunk.type === "explanation" || chunk.id === q.id)
              ) {
                candidateIds.add(chunk.id);
                fusionScores[chunk.id] = (fusionScores[chunk.id] ?? 0) + 0.1;
              }
            }
          }
        }
      }

      if (intent === "explain") {
        for (const chunk of allChunks) {
          if (chunk.type === "model_answer" && (!topicId || chunk.topicId === topicId)) {
            candidateIds.add(chunk.id);
            fusionScores[chunk.id] = (fusionScores[chunk.id] ?? 0) + 0.5;
          }
        }
      }

      const candidates = allChunks.filter((c) => candidateIds.has(c.id));
      const topK = intent === "practice" ? 12 : Number(process.env.RAG_TOP_K ?? 8);
      const chunks = topChunksByFusion(candidates, fusionScores, topK);

      const entry = store.findTopicEntry(topic);
      const topicLabel = entry?.label ?? topic;

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
