import { loadRagConfig } from "../rag/config.mjs";
import { ensureIndexReady } from "../rag/index/index-manager.mjs";
import { retrieveContext } from "../rag/retriever.mjs";
import { rerankChunks } from "../rag/reranker.mjs";
import { assembleContext, shouldUseRAG } from "../rag/context.mjs";
import { analyzeLocally } from "../analyzer.mjs";

const config = loadRagConfig();
process.env.RAG_ENABLED = "true";

await ensureIndexReady(config);

const payload = {
  topic: "photosynthesis",
  mode: "text",
  text: "Plants eat soil to get food and release carbon dioxide during photosynthesis at night.",
  nodes: [],
};

const retrieval = await retrieveContext(payload, config);
console.log("Retrieved chunks:", retrieval.chunks.length);
console.log("Topic:", retrieval.resolvedTopicLabel, retrieval.topicConfidence);
console.log(
  "Top chunks:",
  retrieval.chunks.slice(0, 5).map((c) => `${c.type}:${c.title}`)
);

const ranked = rerankChunks(retrieval.chunks, payload);
const topicMatch = retrieval.topicConfidence === "high" ? 0.9 : 0.75;
const context = assembleContext(ranked, {
  topic: payload.topic,
  topicKey: retrieval.resolvedTopicKey,
  topicLabel: retrieval.resolvedTopicLabel,
  topicMatch,
  budget: config.tokenBudget,
});

console.log("shouldUseRAG:", shouldUseRAG(context, config));
console.log("Concepts in index:", context?.highlightIndex?.concepts?.length);

const feedback = analyzeLocally(payload, { highlightIndex: context?.highlightIndex });
console.log("\nFeedback score:", feedback.score);
console.log(
  "Items:",
  feedback.items.map((i) => `${i.kind}: ${i.title}${i.span ? ` [span: "${i.span}"]` : ""}`)
);

const soilMiscon = feedback.items.find((i) => i.kind === "misconception");
if (!soilMiscon) {
  console.error("FAIL: expected soil misconception");
  process.exit(1);
}
console.log("\nPASS: Hybrid RAG pipeline works");
