#!/usr/bin/env node
import { buildChunksFromTopics } from "../server/rag/chunker.mjs";
import { getKnowledgeStore, resetKnowledgeStore } from "../server/rag/knowledge-store.mjs";

const chunks = buildChunksFromTopics();
resetKnowledgeStore();
const store = getKnowledgeStore();

const byType = chunks.reduce((acc, c) => {
  acc[c.type] = (acc[c.type] || 0) + 1;
  return acc;
}, {});

console.log("Padhaaku knowledge ingest");
console.log("-------------------------");
console.log(`Total chunks: ${chunks.length}`);
console.log("By type:", byType);
console.log(`Sparse index docs: ${store.sparse.docTokens.length}`);
console.log(`Dense provider: ${store.vector.hasProvider() ? "openai" : "disabled (sparse-only)"}`);

if (store.vector.hasProvider()) {
  await store.vector.ensureIndexed();
  console.log(`Dense vectors indexed: ${store.vector.vectors.size}`);
}

console.log("\nSample retrieval — photosynthesis + 'plants eat soil':");
const routeQuery = "photosynthesis plants eat soil";
const hits = store.sparse.search(routeQuery, { topicId: "photosynthesis", limit: 5 });
for (const hit of hits) {
  console.log(`  [${hit.chunk.type}] ${hit.chunk.title} (score=${hit.score.toFixed(2)})`);
}
