import { TOPICS } from "../concepts.mjs";

/**
 * Flatten the static knowledge bank into retrievable chunks.
 * @returns {import("./types.mjs").ContextChunk[]}
 */
export function buildChunksFromTopics() {
  /** @type {import("./types.mjs").ContextChunk[]} */
  const chunks = [];

  for (const [topicId, entry] of Object.entries(TOPICS)) {
    chunks.push({
      chunkId: `${topicId}:meta`,
      topicId,
      topicLabel: entry.label,
      type: "topic_meta",
      title: entry.label,
      body: [entry.label, ...(entry.aliases || [])].join(". "),
      keywords: [...(entry.aliases || []), entry.label.toLowerCase()],
    });

    for (const concept of entry.concepts || []) {
      chunks.push({
        chunkId: `${topicId}:concept:${concept.id}`,
        topicId,
        topicLabel: entry.label,
        type: "concept",
        title: concept.label,
        body: [concept.label, concept.hint, ...(concept.keywords || [])].join(". "),
        keywords: concept.keywords || [],
        importance: concept.importance ?? 1,
        hint: concept.hint,
      });
    }

    for (const misconception of entry.misconceptions || []) {
      chunks.push({
        chunkId: `${topicId}:misconception:${misconception.id}`,
        topicId,
        topicLabel: entry.label,
        type: "misconception",
        title: misconception.label,
        body: [misconception.label, misconception.correction, ...(misconception.match || [])].join(". "),
        keywords: misconception.match || [],
        matchPhrases: misconception.match || [],
        correction: misconception.correction,
      });
    }

    if (entry.modelAnswer) {
      chunks.push({
        chunkId: `${topicId}:model_answer`,
        topicId,
        topicLabel: entry.label,
        type: "model_answer",
        title: `Model answer: ${entry.label}`,
        body: entry.modelAnswer,
        keywords: [],
      });
    }
  }

  return chunks;
}
