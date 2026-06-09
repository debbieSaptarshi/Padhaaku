import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { analyzeLocally } from "./analyzer.mjs";
import { analyzeWithLLM } from "./llm.mjs";
import { hasLLM } from "./llm-client.mjs";
import { runFeedbackPipeline, isHybridRagEnabled } from "./orchestrator.mjs";
import { AGENTS } from "./agent-registry.mjs";
import { normalizeFeedbackRequest } from "./shared/feedback-contract.mjs";
import { handleChatStudyRequest } from "./adapters/chat-route.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    llm: hasLLM(),
    hybridRag: isHybridRagEnabled(),
    agents: AGENTS.map((a) => ({ id: a.id, name: a.name, order: a.order })),
  });
});

app.post("/api/feedback", async (req, res) => {
  try {
    const parsed = normalizeFeedbackRequest(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }

    let result = null;
    if (isHybridRagEnabled()) {
      try {
        result = await runFeedbackPipeline(parsed.payload);
      } catch (err) {
        console.error("[hybrid-rag] falling back:", err.message);
      }
    }

    if (!result && hasLLM()) {
      try {
        result = await analyzeWithLLM(parsed.payload);
      } catch (err) {
        console.error("[llm] falling back to local:", err.message);
      }
    }

    if (!result) {
      result = analyzeLocally(parsed.payload);
    }

    res.json(result);
  } catch (err) {
    console.error("[feedback] error:", err);
    res.status(500).json({ error: "Failed to analyze. Please try again." });
  }
});

// Shared endpoint for parallel prototypes (Next.js chat branch, Expo, etc.)
app.post("/api/chat", async (req, res) => {
  try {
    const out = await handleChatStudyRequest(req.body);
    res.status(out.status).json(out.body);
  } catch (err) {
    console.error("[chat] error:", err);
    res.status(500).json({ error: "Failed to generate a reply. Please try again." });
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

app.listen(PORT, () => {
  console.log(
    `[padhaaku] API on http://localhost:${PORT} (llm=${hasLLM()}, hybridRag=${isHybridRagEnabled()})`
  );
});
