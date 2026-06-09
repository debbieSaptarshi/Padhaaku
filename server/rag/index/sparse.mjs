import MiniSearch from "minisearch";
import fs from "node:fs";
import path from "node:path";

/**
 * @param {import("../types.mjs").KnowledgeChunk} chunk
 */
function bm25Doc(chunk) {
  return {
    id: chunk.chunkId,
    title: chunk.title,
    text: chunk.text,
    keywords: [...chunk.keywords, ...chunk.keywords].join(" "),
    matchPhrases: chunk.matchPhrases.join(" "),
    topicKey: chunk.topicKey,
    topicAliases: chunk.topicAliases.join(" "),
    type: chunk.type,
  };
}

/**
 * @param {import("../types.mjs").KnowledgeChunk[]} chunks
 */
export function buildSparseIndex(chunks) {
  const ms = new MiniSearch({
    fields: ["title", "text", "keywords", "matchPhrases", "topicAliases"],
    storeFields: ["id", "type", "topicKey"],
    searchOptions: {
      boost: { matchPhrases: 3, keywords: 2.5, title: 2, topicAliases: 1.5, text: 1 },
      prefix: true,
      fuzzy: 0.15,
    },
  });
  ms.addAll(chunks.map(bm25Doc));
  return ms;
}

/**
 * @param {MiniSearch} index
 * @param {string} query
 * @param {{ filterType?: string, topicKey?: string | null, limit?: number }} [opts]
 */
export function searchSparse(index, query, opts = {}) {
  const { filterType, topicKey, limit = 10 } = opts;
  if (!query.trim()) return [];

  const raw = index.search(query);
  return raw
    .filter((hit) => {
      if (filterType && hit.type !== filterType) return false;
      if (topicKey && hit.topicKey !== topicKey) return false;
      return true;
    })
    .slice(0, limit)
    .map((hit, i) => ({
      chunkId: hit.id,
      score: hit.score,
      rank: i + 1,
      source: "sparse",
    }));
}

export function saveSparseIndex(index, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(index.toJSON()));
}

export function loadSparseIndex(filePath, chunks) {
  if (!fs.existsSync(filePath)) return buildSparseIndex(chunks);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return MiniSearch.loadJSON(data, {
      fields: ["title", "text", "keywords", "matchPhrases", "topicAliases"],
      storeFields: ["id", "type", "topicKey"],
      searchOptions: {
        boost: { matchPhrases: 3, keywords: 2.5, title: 2, topicAliases: 1.5, text: 1 },
        prefix: true,
        fuzzy: 0.15,
      },
    });
  } catch {
    return buildSparseIndex(chunks);
  }
}
