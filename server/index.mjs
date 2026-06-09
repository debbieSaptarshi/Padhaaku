import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import crypto from "node:crypto";
import { hasLLM } from "./llm.mjs";
import { initRag, runFeedbackPipeline, getRagConfig } from "./rag/orchestrator.mjs";
import { getIndexStatus } from "./rag/index/index-manager.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const ragConfig = getRagConfig();

const app = express();
app.use(express.json({ limit: "1mb" }));

function normalizePayload(body) {
  const { topic, mode, text, nodes } = body || {};
  if (!topic || typeof topic !== "string") {
    throw new Error("A 'topic' is required.");
  }
  return {
    topic: topic.slice(0, 200),
    mode: mode === "mindmap" ? "mindmap" : "text",
    text: typeof text === "string" ? text.slice(0, 8000) : "",
    nodes: Array.isArray(nodes)
      ? nodes
          .filter((n) => n && n.text)
          .slice(0, 60)
          .map((n) => ({ id: String(n.id), text: String(n.text).slice(0, 300) }))
      : [],
  };
}

app.get("/api/health", (_req, res) => {
  const indexStatus = getIndexStatus();
  res.json({
    ok: true,
    llm: hasLLM(),
    rag: {
      enabled: ragConfig.enabled,
      ready: indexStatus.ready,
      chunks: indexStatus.chunkCount,
      topics: indexStatus.topicCount,
      hasVectors: indexStatus.hasVectors,
    },
  });
});

app.get("/api/knowledge/status", (_req, res) => {
  const indexStatus = getIndexStatus();
  res.json({
    ...indexStatus,
    enabled: ragConfig.enabled,
    phase: ragConfig.phase,
  });
});

app.post("/api/feedback", async (req, res) => {
  const requestId = crypto.randomUUID();
  try {
    const payload = normalizePayload(req.body);
    const { feedback, meta } = await runFeedbackPipeline(payload, { requestId });

    if (ragConfig.debugMeta) {
      feedback._meta = meta;
    }

    res.json(feedback);
  } catch (err) {
    if (err.message === "A 'topic' is required.") {
      return res.status(400).json({ error: err.message });
    }
    console.error(`[feedback:${requestId}] error:`, err);
    res.status(500).json({ error: "Failed to analyze. Please try again." });
  }
});

// Serve the built frontend in production.
const distDir = path.join(__dirname, "..", "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

async function start() {
  if (ragConfig.enabled) {
    try {
      const status = await initRag();
      console.log(`[padhaaku] RAG index ready (${status.chunkCount} chunks, vectors=${status.hasVectors})`);
    } catch (err) {
      console.warn("[padhaaku] RAG init failed, running without retrieval:", err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`[padhaaku] API on http://localhost:${PORT} (llm=${hasLLM()}, rag=${ragConfig.enabled})`);
  });
}

start();
