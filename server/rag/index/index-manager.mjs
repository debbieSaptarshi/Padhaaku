import fs from "node:fs";
import path from "node:path";
import { chunkFromConcepts } from "../chunkers/curated.mjs";
import { embedBatch, hasEmbeddingProvider } from "../embeddings.mjs";
import { buildSparseIndex, loadSparseIndex, saveSparseIndex } from "./sparse.mjs";

/** @type {{ ready: boolean, chunks: import("../types.mjs").KnowledgeChunk[], sparse: import("minisearch").default | null, vectors: { chunkId: string, vector: number[], type: string, topicKey: string }[], chunkMap: Map<string, import("../types.mjs").KnowledgeChunk> } | null} */
let state = null;

/**
 * @param {import("../config.mjs").loadRagConfig extends () => infer R ? R : never} config
 */
export async function ensureIndexReady(config) {
  if (state?.ready) return state;

  const indexDir = config.indexPath;
  fs.mkdirSync(indexDir, { recursive: true });

  const chunks = chunkFromConcepts();
  const chunkMap = new Map(chunks.map((c) => [c.chunkId, c]));

  const sparsePath = path.join(indexDir, "minisearch.json");
  const vectorsPath = path.join(indexDir, "vectors.json");
  const manifestPath = path.join(indexDir, "manifest.json");

  let sparse = loadSparseIndex(sparsePath, chunks);
  let vectors = [];

  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    : null;

  const needsRebuild =
    !manifest ||
    manifest.chunkCount !== chunks.length ||
    manifest.conceptsHash !== hashChunks(chunks);

  if (needsRebuild) {
    sparse = buildSparseIndex(chunks);
    saveSparseIndex(sparse, sparsePath);

    if (hasEmbeddingProvider()) {
      try {
        const embeddings = await embedBatch(chunks.map((c) => c.text));
        vectors = chunks.map((c, i) => ({
          chunkId: c.chunkId,
          vector: embeddings[i] || [],
          type: c.type,
          topicKey: c.topicKey,
        }));
        fs.writeFileSync(vectorsPath, JSON.stringify(vectors));
      } catch (err) {
        console.warn("[rag] embedding build failed, sparse-only:", err.message);
        vectors = [];
      }
    }

    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        chunkCount: chunks.length,
        conceptsHash: hashChunks(chunks),
        builtAt: new Date().toISOString(),
        hasVectors: vectors.length > 0,
      })
    );
  } else if (fs.existsSync(vectorsPath)) {
    vectors = JSON.parse(fs.readFileSync(vectorsPath, "utf8"));
  }

  state = { ready: true, chunks, sparse, vectors, chunkMap };
  return state;
}

export function getIndexStatus() {
  if (!state) return { ready: false, chunkCount: 0, topicCount: 0, hasVectors: false };
  const topics = new Set(state.chunks.map((c) => c.topicKey));
  return {
    ready: true,
    chunkCount: state.chunks.length,
    topicCount: topics.size,
    hasVectors: state.vectors.length > 0,
  };
}

export function getIndex() {
  if (!state?.ready) throw new Error("RAG index not ready");
  return state;
}

/**
 * @param {import("../types.mjs").KnowledgeChunk[]} chunks
 */
function hashChunks(chunks) {
  return String(chunks.length) + ":" + chunks.map((c) => c.chunkId).join(",");
}
