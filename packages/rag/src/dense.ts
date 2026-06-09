import type { KnowledgeChunk } from "@padhaaku/core";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Lightweight semantic proxy until a real embedding index is wired (Phase 2). */
export function denseSearch(
  chunks: KnowledgeChunk[],
  query: string,
  topK = 20,
): string[] {
  const queryTokens = new Set(tokenize(query));

  const scored = chunks.map((chunk) => {
    const chunkTokens = new Set(tokenize(`${chunk.text} ${chunk.keywords.join(" ")}`));
    let overlap = 0;
    for (const token of queryTokens) {
      if (chunkTokens.has(token)) overlap += 1;
    }

    const jaccard =
      overlap /
      Math.max(1, new Set([...queryTokens, ...chunkTokens]).size);

    return { id: chunk.id, score: jaccard * (chunk.importance / 3) };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.id);
}
