import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function bool(val, fallback = false) {
  if (val === undefined || val === null || val === "") return fallback;
  return val === "1" || val === "true" || val === "yes";
}

function num(val, fallback) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export function loadRagConfig() {
  const dataDir = process.env.RAG_DATA_DIR || path.join(__dirname, "..", "data");
  return {
    enabled: bool(process.env.RAG_ENABLED, false),
    phase: num(process.env.RAG_PHASE, 1),
    dataDir,
    indexPath: process.env.RAG_INDEX_PATH || path.join(dataDir, "indexes"),
    migrateOnStart: bool(process.env.RAG_MIGRATE_ON_START, true),
    topK: num(process.env.RAG_TOP_K, 20),
    finalK: num(process.env.RAG_FINAL_K, 12),
    rrfK: num(process.env.RRF_K, 60),
    tokenBudget: num(process.env.RAG_TOKEN_BUDGET, 2800),
    minTopicMatch: num(process.env.RAG_MIN_TOPIC_MATCH, 0.7),
    minFusion: num(process.env.RAG_MIN_FUSION, 0.55),
    minRerank: num(process.env.RAG_MIN_RERANK, 0.4),
    rerankerMode: process.env.RERANKER_MODE || "heuristic",
    embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    debugMeta: bool(process.env.RAG_DEBUG_META, false),
    logLevel: process.env.RAG_LOG_LEVEL || "info",
  };
}
