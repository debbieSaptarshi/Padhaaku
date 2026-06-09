import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { analyzeLocally } from "./analyzer.mjs";
import { analyzeWithLLM, hasLLM } from "./llm.mjs";
import { finalizeFeedback } from "./schema.mjs";
import { listTopics } from "./topics-meta.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, llm: hasLLM() });
});

app.get("/api/topics", (_req, res) => {
  res.json(listTopics());
});

app.post("/api/feedback", async (req, res) => {
  try {
    const {
      topic,
      mode,
      text,
      nodes,
      edges,
      attemptNumber = 1,
      previousScore = null,
      unlockModelAnswer = false,
    } = req.body || {};

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "A 'topic' is required." });
    }

    const payload = {
      topic: topic.slice(0, 200),
      mode: mode === "mindmap" ? "mindmap" : "text",
      text: typeof text === "string" ? text.slice(0, 8000) : "",
      nodes: Array.isArray(nodes)
        ? nodes
            .filter((n) => n && n.text)
            .slice(0, 60)
            .map((n) => ({ id: String(n.id), text: String(n.text).slice(0, 300) }))
        : [],
      edges: Array.isArray(edges)
        ? edges
            .slice(0, 80)
            .map((e) => ({ from: String(e.from), to: String(e.to) }))
        : [],
      attemptNumber: Math.max(1, Math.min(99, Number(attemptNumber) || 1)),
      previousScore:
        previousScore != null && !Number.isNaN(Number(previousScore))
          ? Number(previousScore)
          : null,
      unlockModelAnswer: Boolean(unlockModelAnswer),
    };

    let result = null;
    if (hasLLM()) {
      try {
        result = await analyzeWithLLM(payload);
        if (result) {
          result = finalizeFeedback(result, {
            attemptNumber: payload.attemptNumber,
            unlockModelAnswer: payload.unlockModelAnswer,
            previousScore: payload.previousScore,
            text: payload.text,
            nodes: payload.nodes,
            topic: payload.topic,
          });
        }
      } catch (err) {
        console.error("[llm] falling back to local:", err.message);
      }
    }
    if (!result) {
      result = analyzeLocally(payload);
    }
    res.json(result);
  } catch (err) {
    console.error("[feedback] error:", err);
    res.status(500).json({ error: "Failed to analyze. Please try again." });
  }
});

const distDir = path.join(__dirname, "..", "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[padhaaku] API on http://localhost:${PORT} (llm=${hasLLM()})`);
});
