import type { KnowledgeChunk } from "../../core/src/types";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Lightweight BM25-style keyword scorer for MVP (no external deps). */
export function sparseSearch(
  chunks: KnowledgeChunk[],
  query: string,
  topK = 20,
): string[] {
  const queryTokens = new Set(tokenize(query));
  const topicTokens = tokenize(query);

  const scored = chunks.map((chunk) => {
    const textTokens = tokenize(chunk.text);
    const keywordHits = chunk.keywords.filter((k) =>
      [...queryTokens].some((t) => k.toLowerCase().includes(t) || t.includes(k.toLowerCase())),
    ).length;

    const textHits = textTokens.filter((t) => queryTokens.has(t)).length;
    const topicBoost = topicTokens.some((t) => chunk.topicId.includes(t)) ? 2 : 0;
    const typeBoost =
      chunk.type === "misconception" ? 1.5 : chunk.type === "concept" ? 1.2 : 1;

    const score =
      (keywordHits * 3 + textHits + topicBoost) * typeBoost * (chunk.importance / 3);

    return { id: chunk.id, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.id);
}
