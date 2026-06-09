import { buildChunksFromTopics } from "./chunker.mjs";
import { SparseIndex } from "./sparse.mjs";
import { VectorIndex } from "./vector.mjs";

let store = null;

export function getKnowledgeStore() {
  if (!store) {
    const chunks = buildChunksFromTopics();
    store = {
      chunks,
      sparse: new SparseIndex(chunks),
      vector: new VectorIndex(chunks),
    };
  }
  return store;
}

export function resetKnowledgeStore() {
  store = null;
}
