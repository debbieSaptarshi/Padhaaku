/**
 * Reciprocal Rank Fusion across multiple ranked lists.
 * @param {{ chunkId: string, score: number, rank: number, source: string }[][]} rankLists
 * @param {number} k
 * @returns {{ chunkId: string, fusionScore: number }[]}
 */
export function fuseRRF(rankLists, k = 60) {
  /** @type {Map<string, number>} */
  const scores = new Map();

  for (const list of rankLists) {
    for (const hit of list) {
      const prev = scores.get(hit.chunkId) || 0;
      scores.set(hit.chunkId, prev + 1 / (k + hit.rank));
    }
  }

  return [...scores.entries()]
    .map(([chunkId, fusionScore]) => ({ chunkId, fusionScore }))
    .sort((a, b) => b.fusionScore - a.fusionScore);
}
