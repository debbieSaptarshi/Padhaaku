export function hasEmbeddingProvider() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * @param {string[]} texts
 * @param {string} model
 * @returns {Promise<number[][]>}
 */
export async function embedBatch(texts, model = process.env.EMBEDDING_MODEL || "text-embedding-3-small") {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !texts.length) return [];

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
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((row) => row.embedding);
}

/**
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedOne(text) {
  const [vec] = await embedBatch([text]);
  return vec || [];
}
