function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function termFrequency(tokens) {
  const tf = new Map();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

/**
 * Lightweight BM25-style sparse scorer over in-memory chunks.
 */
export class SparseIndex {
  /** @param {import("./types.mjs").ContextChunk[]} chunks */
  constructor(chunks) {
    this.chunks = chunks;
    this.avgDocLen = 0;
    this.docFreq = new Map();
    this.docTokens = chunks.map((chunk) => {
      const text = [chunk.title, chunk.body, ...(chunk.keywords || [])].join(" ");
      const tokens = tokenize(text);
      const tf = termFrequency(tokens);
      for (const token of new Set(tokens)) {
        this.docFreq.set(token, (this.docFreq.get(token) || 0) + 1);
      }
      this.avgDocLen += tokens.length;
      return { chunk, tokens, tf, length: tokens.length || 1 };
    });
    this.avgDocLen = this.avgDocLen / Math.max(this.docTokens.length, 1);
    this.N = this.docTokens.length;
  }

  /**
   * @param {string} query
   * @param {{ topicId?: string | null, types?: string[], limit?: number }} [opts]
   * @returns {import("./types.mjs").ScoredChunk[]}
   */
  search(query, opts = {}) {
    const { topicId = null, types = null, limit = 12 } = opts;
    const qTokens = tokenize(query);
    if (!qTokens.length) return [];

    const k1 = 1.2;
    const b = 0.75;
    const results = [];

    for (const doc of this.docTokens) {
      if (topicId && doc.chunk.topicId !== topicId) continue;
      if (types && types.length && !types.includes(doc.chunk.type)) continue;

      let score = 0;
      for (const token of qTokens) {
        const tf = doc.tf.get(token) || 0;
        if (!tf) continue;
        const df = this.docFreq.get(token) || 0;
        const idf = Math.log(1 + (this.N - df + 0.5) / (df + 0.5));
        const denom = tf + k1 * (1 - b + (b * doc.length) / this.avgDocLen);
        score += idf * ((tf * (k1 + 1)) / denom);
      }

      if (score > 0) {
        results.push({ chunk: doc.chunk, score, sparseScore: score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
