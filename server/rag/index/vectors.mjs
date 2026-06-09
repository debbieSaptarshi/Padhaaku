/**
 * @param {number[]} a
 * @param {number[]} b
 */
function cosineSimilarity(a, b) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * @param {number[]} queryVec
 * @param {{ chunkId: string, vector: number[], type: string, topicKey: string }[]} store
 * @param {{ filterType?: string, topicKey?: string | null, limit?: number }} [opts]
 */
export function searchVectors(queryVec, store, opts = {}) {
  const { filterType, topicKey, limit = 10 } = opts;
  if (!queryVec.length) return [];

  const scored = store
    .filter((row) => {
      if (filterType && row.type !== filterType) return false;
      if (topicKey && row.topicKey !== topicKey) return false;
      return true;
    })
    .map((row) => ({
      chunkId: row.chunkId,
      score: cosineSimilarity(queryVec, row.vector),
      source: "dense",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((hit, i) => ({ ...hit, rank: i + 1 }));

  return scored;
}
