import { TOPICS } from "../../concepts.mjs";

/**
 * Flatten concepts.mjs TOPICS into atomic KnowledgeChunks.
 * @returns {import("../types.mjs").KnowledgeChunk[]}
 */
export function chunkFromConcepts() {
  /** @type {import("../types.mjs").KnowledgeChunk[]} */
  const chunks = [];

  for (const [topicKey, entry] of Object.entries(TOPICS)) {
    chunks.push({
      chunkId: `${topicKey}:overview`,
      topicKey,
      topicLabel: entry.label,
      topicAliases: entry.aliases,
      type: "topic_overview",
      entityId: null,
      importance: null,
      keywords: entry.aliases,
      matchPhrases: [],
      title: entry.label,
      text: `${entry.label}. Also known as: ${entry.aliases.join(", ")}. ${entry.modelAnswer}`,
      modelAnswer: entry.modelAnswer,
    });

    chunks.push({
      chunkId: `${topicKey}:model_answer`,
      topicKey,
      topicLabel: entry.label,
      topicAliases: entry.aliases,
      type: "model_answer",
      entityId: "model",
      importance: null,
      keywords: [],
      matchPhrases: [],
      title: `Model answer: ${entry.label}`,
      text: entry.modelAnswer,
      modelAnswer: entry.modelAnswer,
    });

    for (const c of entry.concepts) {
      chunks.push({
        chunkId: `${topicKey}:concept:${c.id}`,
        topicKey,
        topicLabel: entry.label,
        topicAliases: entry.aliases,
        type: "concept",
        entityId: c.id,
        importance: c.importance,
        keywords: c.keywords,
        matchPhrases: [],
        title: c.label,
        text: `${c.label}. ${c.hint} Keywords: ${c.keywords.join(", ")}.`,
        hint: c.hint,
      });
    }

    for (const m of entry.misconceptions) {
      chunks.push({
        chunkId: `${topicKey}:misconception:${m.id}`,
        topicKey,
        topicLabel: entry.label,
        topicAliases: entry.aliases,
        type: "misconception",
        entityId: m.id,
        importance: null,
        keywords: m.match,
        matchPhrases: m.match,
        title: m.label,
        text: `Misconception: ${m.label}. Learner might say: ${m.match.join("; ")}. Correction: ${m.correction}`,
        correction: m.correction,
      });
    }
  }

  return chunks;
}
