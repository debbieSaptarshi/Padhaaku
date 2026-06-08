import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { analyzeLocally } from "./analyzer.mjs";
import { analyzeWithLLM, hasLLM } from "./llm.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, llm: hasLLM() });
});

app.post("/api/feedback", async (req, res) => {
  try {
    const { topic, mode, text, nodes } = req.body || {};
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
    };

    let result = null;
    if (hasLLM()) {
      try {
        result = await analyzeWithLLM(payload);
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

// Serve the built frontend in production.
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
