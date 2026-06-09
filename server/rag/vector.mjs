function dot(a, b) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
}

function norm(v) {
  return Math.sqrt(dot(v, v));
}

function cosineSimilarity(a, b) {
  const denom = norm(a) * norm(b);
  if (!denom) return 0;
  return dot(a, b) / denom;
}

/**
 * In-memory dense index with optional OpenAI embeddings.
 */
export class VectorIndex {
  /** @param {import("./types.mjs").ContextChunk[]} chunks */
  constructor(chunks) {
    this.chunks = chunks;
    /** @type {Map<string, number[]>} */
    this.vectors = new Map();
    this.ready = false;
  }

  hasProvider() {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async ensureIndexed() {
    if (this.ready) return;
    if (!this.hasProvider()) {
      this.ready = true;
      return;
    }

    const texts = this.chunks.map((c) => [c.title, c.body].join("\n"));
    const embeddings = await embedBatch(texts, process.env.OPENAI_API_KEY);
    for (let i = 0; i < this.chunks.length; i++) {
      this.vectors.set(this.chunks[i].chunkId, embeddings[i]);
    }
    this.ready = true;
  }

  /**
   * @param {string} query
   * @param {{ topicId?: string | null, types?: string[], limit?: number }} [opts]
   * @returns {Promise<import("./types.mjs").ScoredChunk[]>}
   */
  async search(query, opts = {}) {
    const { topicId = null, types = null, limit = 12 } = opts;
    await this.ensureIndexed();
    if (!this.hasProvider() || this.vectors.size === 0) return [];

    const [queryVec] = await embedBatch([query], process.env.OPENAI_API_KEY);
    const results = [];

    for (const chunk of this.chunks) {
      if (topicId && chunk.topicId !== topicId) continue;
      if (types && types.length && !types.includes(chunk.type)) continue;
      const vec = this.vectors.get(chunk.chunkId);
      if (!vec) continue;
      const score = cosineSimilarity(queryVec, vec);
      if (score > 0) {
        results.push({ chunk, score, denseScore: score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

async function embedBatch(texts, apiKey) {
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: texts }),
  });
  if (!res.ok) {
    throw new Error(`Embeddings ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.data.map((row) => row.embedding);
}
