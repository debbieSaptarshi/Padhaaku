/**
 * Reciprocal Rank Fusion for sparse + dense retrieval lists.
 * @param {import("./types.mjs").ScoredChunk[]} sparse
 * @param {import("./types.mjs").ScoredChunk[]} dense
 * @param {{ k?: number, sparseWeight?: number, denseWeight?: number, limit?: number }} [opts]
 * @returns {import("./types.mjs").ScoredChunk[]}
 */
export function reciprocalRankFusion(sparse, dense, opts = {}) {
  const { k = 60, sparseWeight = 0.4, denseWeight = 0.6, limit = 12 } = opts;
  /** @type {Map<string, import("./types.mjs").ScoredChunk>} */
  const merged = new Map();

  const addList = (list, weight, scoreKey) => {
    list.forEach((item, rank) => {
      const id = item.chunk.chunkId;
      const rrf = weight * (1 / (k + rank + 1));
      const existing = merged.get(id) || { chunk: item.chunk, score: 0 };
      existing.score += rrf;
      existing.rrfScore = existing.score;
      existing[scoreKey] = item[scoreKey] ?? item.score;
      merged.set(id, existing);
    });
  };

  addList(sparse, sparseWeight, "sparseScore");
  addList(dense, denseWeight, "denseScore");

  return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
