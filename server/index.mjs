import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { analyzeLocally } from "./analyzer.mjs";
import { analyzeWithLLM, hasLLM } from "./llm.mjs";
import { applyResponsePolicy } from "./validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

const app = express();
app.use(express.json({ limit: "6mb" }));

const VALID_MODES = new Set(["mindmap", "text", "handwriting"]);

function sanitizeStrokes(strokes) {
  if (!Array.isArray(strokes)) return [];
  return strokes
    .slice(0, 200)
    .map((s) => ({
      id: String(s.id || ""),
      color: String(s.color || "#1a1a2e").slice(0, 20),
      width: Math.min(12, Math.max(0.5, Number(s.width) || 2)),
      points: Array.isArray(s.points)
        ? s.points.slice(0, 2000).map((p) => ({
            x: Math.round(Number(p.x) || 0),
            y: Math.round(Number(p.y) || 0),
          }))
        : [],
    }))
    .filter((s) => s.points.length > 0);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, llm: hasLLM() });
});

app.post("/api/feedback", async (req, res) => {
  try {
    const body = req.body || {};
    const { topic } = body;
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "A 'topic' is required." });
    }

    const mode = VALID_MODES.has(body.mode) ? body.mode : "text";
    const payload = {
      topic: topic.slice(0, 200),
      mode,
      text: typeof body.text === "string" ? body.text.slice(0, 8000) : "",
      nodes: Array.isArray(body.nodes)
        ? body.nodes
            .filter((n) => n && n.text)
            .slice(0, 60)
            .map((n) => ({ id: String(n.id), text: String(n.text).slice(0, 300) }))
        : [],
      edges: Array.isArray(body.edges)
        ? body.edges
            .slice(0, 80)
            .map((e) => ({ from: String(e.from), to: String(e.to) }))
        : [],
      strokes: sanitizeStrokes(body.strokes),
      handwritingImage:
        typeof body.handwritingImage === "string" &&
        body.handwritingImage.startsWith("data:image") &&
        body.handwritingImage.length < 5_000_000
          ? body.handwritingImage
          : null,
      attemptNumber: Math.max(1, Math.min(50, Number(body.attemptNumber) || 1)),
      previousScore:
        body.previousScore === null || body.previousScore === undefined
          ? null
          : Number(body.previousScore),
      sessionStartedAt: Number(body.sessionStartedAt) || Date.now(),
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

    const response = applyResponsePolicy(result, {
      attemptNumber: payload.attemptNumber,
      previousScore: payload.previousScore,
      sessionStartedAt: payload.sessionStartedAt,
    });

    res.json(response);
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
