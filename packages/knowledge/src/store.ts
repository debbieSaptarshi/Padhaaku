import type { KnowledgeChunk } from "@padhaaku/core";
import type { ConceptEntry, PracticeQuestionSeed } from "./ingest";
import { conceptsToChunks, questionsToChunks } from "./ingest";

export type KnowledgeStore = {
  getAllChunks(): KnowledgeChunk[];
  getChunksByTopic(topicId: string): KnowledgeChunk[];
  findTopicId(topic: string): string | null;
  findTopicEntry(topic: string): ConceptEntry | null;
  getGraphNeighbors(topicId: string): string[];
  getGenericFollowups(): string[];
};

export function createKnowledgeStore(
  topics: Record<string, ConceptEntry>,
  questions: PracticeQuestionSeed[],
  genericFollowups: string[],
): KnowledgeStore {
  const chunks = [...conceptsToChunks(topics), ...questionsToChunks(questions)];
  const topicKeys = Object.keys(topics);

  return {
    getAllChunks: () => chunks,
    getChunksByTopic: (topicId) => chunks.filter((c) => c.topicId === topicId),
    findTopicId(rawTopic) {
      const entry = this.findTopicEntry(rawTopic);
      if (!entry) return null;
      return topicKeys.find((k) => topics[k] === entry) ?? null;
    },
    findTopicEntry(rawTopic) {
      const t = (rawTopic || "").trim().toLowerCase();
      if (!t) return null;
      for (const key of topicKeys) {
        const entry = topics[key];
        if (entry.aliases.some((a) => t === a || t.includes(a) || a.includes(t))) {
          return entry;
        }
      }
      return null;
    },
    getGraphNeighbors(topicId) {
      const entry = topics[topicId];
      if (!entry?.prerequisites?.length) return [];
      return entry.prerequisites;
    },
    getGenericFollowups: () => genericFollowups,
  };
}
