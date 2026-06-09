import crypto from "node:crypto";
import { analyzeLocally } from "../analyzer.mjs";
import { analyzeWithLLM, hasLLM } from "../llm.mjs";
import { loadRagConfig } from "./config.mjs";
import { assembleContext, shouldUseRAG } from "./context.mjs";
import { enrichFeedbackItems } from "./feedback-enrich.mjs";
import { ensureIndexReady, getIndexStatus } from "./index/index-manager.mjs";
import { createTrace } from "./observability.mjs";
import { rerankChunks } from "./reranker.mjs";
import { retrieveContext } from "./retriever.mjs";

const config = loadRagConfig();
let indexBootPromise = null;

export function getRagConfig() {
  return config;
}

export async function initRag() {
  if (!config.enabled) return getIndexStatus();
  if (!indexBootPromise) {
    indexBootPromise = ensureIndexReady(config).catch((err) => {
      console.error("[rag] index init failed:", err.message);
      indexBootPromise = null;
      throw err;
    });
  }
  await indexBootPromise;
  return getIndexStatus();
}

/**
 * @param {import("./types.mjs").FeedbackPayload} payload
 * @param {{ requestId?: string }} [opts]
 */
export async function runFeedbackPipeline(payload, opts = {}) {
  const requestId = opts.requestId || crypto.randomUUID();
  const trace = createTrace(requestId);
  let degradationPath = "local_only";
  let context = null;
  let retrieval = null;

  if (config.enabled) {
    try {
      await trace.stageAsync("index", () => initRag());

      retrieval = await trace.stageAsync("retrieve", () => retrieveContext(payload, config));
      const ranked = trace.stage("rerank", () => rerankChunks(retrieval.chunks, payload));

      const topicMatch =
        retrieval.topicConfidence === "high" ? 0.9 : retrieval.topicConfidence === "medium" ? 0.75 : 0.35;

      context = trace.stage("assemble", () =>
        assembleContext(ranked, {
          topic: payload.topic,
          topicKey: retrieval.resolvedTopicKey,
          topicLabel: retrieval.resolvedTopicLabel,
          topicMatch,
          budget: config.tokenBudget,
        })
      );

      if (context && shouldUseRAG(context, config) && retrieval.fallback !== "generic") {
        degradationPath = "rag_ready";
      } else {
        degradationPath = "rag_weak";
        if (!context?.highlightIndex?.concepts?.length) context = null;
      }
    } catch (err) {
      console.warn(`[rag:${requestId}] pipeline degraded:`, err.message);
      degradationPath = "no_rag";
      context = null;
    }
  }

  let result = null;

  if (hasLLM()) {
    try {
      result = await trace.stageAsync("generate", () =>
        analyzeWithLLM(payload, context?.promptSection ? context : null)
      );
      if (result) degradationPath = context ? "full" : degradationPath === "local_only" ? "llm_only" : degradationPath;
    } catch (err) {
      console.error(`[rag:${requestId}] llm failed:`, err.message);
    }
  }

  if (!result) {
    result = trace.stage("local", () =>
      analyzeLocally(payload, { highlightIndex: context?.highlightIndex ?? null })
    );
    if (degradationPath === "full" || degradationPath === "rag_ready") {
      degradationPath = "llm_fallback_local";
    }
  }

  result = enrichFeedbackItems(result, payload, context?.highlightIndex);
  if (retrieval?.resolvedTopicLabel) {
    result.topicLabel = retrieval.resolvedTopicLabel;
  }

  if (result.provider === "local" && context?.highlightIndex) {
    result.provider = "local+rag";
  }

  const meta = {
    requestId,
    degradationPath,
    hitCount: retrieval?.chunks?.length ?? 0,
    totalMs: trace.totalMs(),
    stages: trace.getStages(),
  };

  trace.log("rag.pipeline", { degradationPath, hitCount: meta.hitCount });

  return { feedback: result, meta };
}
