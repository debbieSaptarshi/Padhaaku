function normalize(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ");
}

/**
 * @param {string} text
 * @param {string[]} keywords
 */
function keywordOverlap(text, keywords) {
  const lower = normalize(text);
  if (!keywords.length) return 0;
  const hits = keywords.filter((k) => lower.includes(normalize(k))).length;
  return hits / keywords.length;
}

/**
 * @param {string} text
 * @param {string[]} phrases
 */
function misconceptionHit(text, phrases) {
  const lower = normalize(text);
  return phrases.some((p) => lower.includes(normalize(p))) ? 1 : 0;
}

/**
 * @param {import("./types.mjs").RankedChunk[]} chunks
 * @param {import("./types.mjs").FeedbackPayload} payload
 */
export function computeLearnerSignals(chunks, payload) {
  const learnerText = [payload.text, ...(payload.nodes || []).map((n) => n.text)].join(" ");
  const mentionedConceptIds = [];
  const triggeredMisconceptionIds = [];

  for (const chunk of chunks) {
    if (chunk.type === "concept" && keywordOverlap(learnerText, chunk.keywords) > 0) {
      mentionedConceptIds.push(chunk.entityId);
    }
    if (chunk.type === "misconception" && misconceptionHit(learnerText, chunk.matchPhrases)) {
      triggeredMisconceptionIds.push(chunk.entityId);
    }
  }

  return { learnerText, mentionedConceptIds, triggeredMisconceptionIds };
}

/**
 * @param {import("./types.mjs").RankedChunk[]} chunks
 * @param {import("./types.mjs").FeedbackPayload} payload
 */
export function rerankChunks(chunks, payload) {
  const { learnerText, triggeredMisconceptionIds } = computeLearnerSignals(chunks, payload);

  const scored = chunks.map((chunk) => {
    const overlap = keywordOverlap(learnerText, chunk.keywords);
    const misconHit = chunk.type === "misconception" ? misconceptionHit(learnerText, chunk.matchPhrases) : 0;

    let typeBoost = 0.4;
    if (chunk.type === "misconception" && misconHit) typeBoost = 1;
    else if (chunk.type === "concept" && overlap === 0) typeBoost = 0.9;
    else if (chunk.type === "concept") typeBoost = 0.6;
    else if (chunk.type === "model_answer") typeBoost = 0.3;
    else if (chunk.type === "topic_overview") typeBoost = 0.5;

    const importanceNorm = chunk.importance ? chunk.importance / 3 : 0;
    const rerankScore =
      0.35 * (chunk.fusionScore || chunk.score || 0) +
      0.25 * overlap +
      0.2 * typeBoost +
      0.1 * importanceNorm +
      0.1 * misconHit;

    return { ...chunk, rerankScore, triggered: triggeredMisconceptionIds.includes(chunk.entityId) };
  });

  scored.sort((a, b) => b.rerankScore - a.rerankScore);
  return deduplicateChunks(scored);
}

/**
 * @param {import("./types.mjs").RankedChunk[]} chunks
 */
export function deduplicateChunks(chunks) {
  const seen = new Set();
  return chunks.filter((c) => {
    const key = `${c.topicKey}:${c.type}:${c.entityId || c.chunkId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
