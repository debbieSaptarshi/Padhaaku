import type { KnowledgeChunk } from "@padhaaku/core";

const RRF_K = 60;

/** Reciprocal Rank Fusion across sparse, dense, and graph ranked lists. */
export function reciprocalRankFusion(
  rankedLists: Array<{ source: string; ids: string[] }>,
  weights: Record<string, number> = {
    sparse: 0.35,
    dense: 0.45,
    graph: 0.2,
  },
): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const list of rankedLists) {
    const weight = weights[list.source] ?? 1;
    list.ids.forEach((id, rank) => {
      scores[id] = (scores[id] ?? 0) + weight * (1 / (RRF_K + rank + 1));
    });
  }

  return scores;
}

export function topChunksByFusion(
  chunks: KnowledgeChunk[],
  fusionScores: Record<string, number>,
  topK = 8,
): KnowledgeChunk[] {
  return [...chunks]
    .sort((a, b) => (fusionScores[b.id] ?? 0) - (fusionScores[a.id] ?? 0))
    .slice(0, topK);
}
