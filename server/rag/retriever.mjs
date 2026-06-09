import { findTopic, TOPICS } from "../concepts.mjs";
import { embedOne, hasEmbeddingProvider } from "./embeddings.mjs";
import { fuseRRF } from "./fusion.mjs";
import { getIndex } from "./index/index-manager.mjs";
import { searchSparse } from "./index/sparse.mjs";
import { searchVectors } from "./index/vectors.mjs";

function normalize(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ");
}

/**
 * @param {string} text
 * @param {string[]} phrases
 */
function hasPhraseHit(text, phrases) {
  const lower = normalize(text);
  return phrases.some((p) => lower.includes(normalize(p)));
}

/**
 * @param {import("./types.mjs").FeedbackPayload} payload
 * @param {import("./config.mjs").loadRagConfig extends () => infer R ? R : never} config
 * @returns {Promise<import("./types.mjs").RetrievalResult>}
 */
export async function retrieveContext(payload, config) {
  const index = getIndex();
  const { chunkMap, sparse, vectors } = index;

  const topicQ = payload.topic.trim();
  const textQ = (payload.text || "").trim();
  const nodeTexts = (payload.nodes || []).map((n) => n.text).filter(Boolean);
  const learnerCorpus = [textQ, ...nodeTexts].join(" ");
  const sparseQ = [topicQ, textQ, ...nodeTexts].join(" ");
  const semanticQ = [`Topic: ${topicQ}`, textQ ? `Learner explanation: ${textQ}` : null, nodeTexts.length ? `Mind map: ${nodeTexts.join(" | ")}` : null]
    .filter(Boolean)
    .join("\n");

  const topicEntry = findTopic(topicQ);
  const resolvedTopicKey =
    topicEntry ? Object.entries(TOPICS).find(([, v]) => v === topicEntry)?.[0] ?? null : null;

  const sparseTopic = searchSparse(sparse, topicQ, { limit: 5 });
  const sparseFull = searchSparse(sparse, sparseQ, { limit: 15 });
  const sparseMiscon = searchSparse(sparse, learnerCorpus || topicQ, { limit: 8 });

  let denseTopic = [];
  let denseSemantic = [];
  let denseMiscon = [];

  if (hasEmbeddingProvider() && vectors.length) {
    try {
      const [topicVec, semanticVec, misconVec] = await Promise.all([
        embedOne(topicQ),
        embedOne(semanticQ),
        embedOne(learnerCorpus || topicQ),
      ]);
      denseTopic = searchVectors(topicVec, vectors, { filterType: "topic_overview", limit: 3 });
      denseSemantic = searchVectors(semanticVec, vectors, { limit: 8 });
      denseMiscon = searchVectors(misconVec, vectors, { filterType: "misconception", limit: 5 });
    } catch (err) {
      console.warn("[rag] dense retrieval failed:", err.message);
    }
  }

  const fused = fuseRRF(
    [denseTopic, denseSemantic, denseMiscon, sparseTopic, sparseFull, sparseMiscon],
    config.rrfK
  );

  const boosted = fused.map((row) => {
    const chunk = chunkMap.get(row.chunkId);
    if (!chunk) return { ...row, boost: 0 };
    let boost = 0;
    if (resolvedTopicKey && chunk.topicKey === resolvedTopicKey) boost += 0.08;
    if (chunk.type === "misconception" && hasPhraseHit(learnerCorpus, chunk.matchPhrases)) boost += 0.05;
    if (chunk.importance) boost += chunk.importance * 0.005;
    return { ...row, boost, fusionScore: row.fusionScore + boost };
  });

  boosted.sort((a, b) => b.fusionScore - a.fusionScore);

  let topicKey = resolvedTopicKey;
  let topicLabel = topicEntry?.label ?? payload.topic;

  if (!topicKey && boosted.length) {
    const top = chunkMap.get(boosted[0].chunkId);
    if (top) {
      topicKey = top.topicKey;
      topicLabel = top.topicLabel;
    }
  }

  const finalK = config.finalK;
  const selected = selectFinalChunks(boosted, chunkMap, finalK, topicKey);

  const topFusion = boosted[0]?.fusionScore ?? 0;
  let topicConfidence = "low";
  if (topicKey && topFusion >= 0.04) topicConfidence = "medium";
  if (topicKey && topFusion >= 0.06 && (topicEntry || denseTopic.length)) topicConfidence = "high";

  const fallback = topicConfidence === "low" && !selected.length ? "generic" : null;

  /** @type {import("./types.mjs").RankedChunk[]} */
  const chunks = selected.map((row, i) => {
    const chunk = chunkMap.get(row.chunkId);
    return {
      ...chunk,
      score: row.fusionScore,
      fusionScore: row.fusionScore,
      rerankScore: row.fusionScore,
      rank: i + 1,
      source: "dense",
    };
  });

  return {
    resolvedTopicKey: topicKey,
    resolvedTopicLabel: topicLabel,
    topicConfidence,
    fallback,
    chunks,
    matchedConcepts: chunks.filter((c) => c.type === "concept"),
    matchedMisconceptions: chunks.filter((c) => c.type === "misconception"),
  };
}

/**
 * @param {{ chunkId: string, fusionScore: number }[]} fused
 * @param {Map<string, import("./types.mjs").KnowledgeChunk>} chunkMap
 * @param {number} finalK
 */
function selectFinalChunks(fused, chunkMap, finalK, topicKey) {
  const misconceptions = [];
  const modelAnswers = [];
  const concepts = [];
  const rest = [];

  for (const row of fused) {
    const chunk = chunkMap.get(row.chunkId);
    if (!chunk) continue;
    if (topicKey && chunk.topicKey !== topicKey) continue;
    if (chunk.type === "misconception") misconceptions.push(row);
    else if (chunk.type === "model_answer" && !modelAnswers.length) modelAnswers.push(row);
    else if (chunk.type === "concept") concepts.push(row);
    else rest.push(row);
  }

  // Ensure topic-scoped coverage: all misconceptions + concepts for resolved topic
  if (topicKey) {
    for (const chunk of chunkMap.values()) {
      if (chunk.topicKey !== topicKey) continue;
      const row = fused.find((r) => r.chunkId === chunk.chunkId) || { chunkId: chunk.chunkId, fusionScore: 0.01 };
      if (chunk.type === "misconception" && !misconceptions.some((m) => m.chunkId === chunk.chunkId)) {
        misconceptions.push(row);
      }
      if (chunk.type === "concept" && !concepts.some((c) => c.chunkId === chunk.chunkId)) {
        concepts.push(row);
      }
      if (chunk.type === "model_answer" && !modelAnswers.length) {
        modelAnswers.push(row);
      }
    }
  }

  const out = [...misconceptions.slice(0, 3), ...modelAnswers, ...concepts, ...rest];
  const seen = new Set();
  const deduped = [];
  for (const row of out) {
    if (seen.has(row.chunkId)) continue;
    seen.add(row.chunkId);
    deduped.push(row);
    if (deduped.length >= finalK) break;
  }
  return deduped;
}
