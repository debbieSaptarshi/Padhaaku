import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  analyzerAgent,
  coachAgent,
  explainerAgent,
  socraticAgent,
} from "@padhaaku/agents";
import { PadhaakuOrchestrator } from "@padhaaku/core";
import { buildKnowledgeStore, loadPracticeSet } from "@padhaaku/knowledge";
import { hasLlm } from "@padhaaku/llm";
import { createHybridRetriever } from "@padhaaku/rag";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 8787);

const store = buildKnowledgeStore();
const retriever = createHybridRetriever(store);
const orchestrator = new PadhaakuOrchestrator({
  retriever,
  useLlm: hasLlm(),
  agents: {
    explainer: explainerAgent,
    socratic: socraticAgent,
    analyzer: analyzerAgent,
    coach: coachAgent,
  },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, llm: hasLlm(), knowledgeVersion: store.version ?? "0.2.0" });
});

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, llm: hasLlm(), knowledgeVersion: store.version ?? "0.2.0" });
});

async function handleChat(req: express.Request, res: express.Response) {
  const message = String(req.body?.message ?? "").trim();
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const history = Array.isArray(req.body?.history)
    ? req.body.history.slice(-6)
    : [];

  const result = await orchestrator.handle({ message, history });
  const payload = result.payload as { reply: string; mode: string };

  return res.json({
    reply: payload.reply,
    mode: payload.mode,
    agent: result.agent,
    provider: result.provider,
    citations: result.citations,
  });
}

async function handleFeedback(req: express.Request, res: express.Response) {
  const topic = String(req.body?.topic ?? "").trim();
  if (!topic) {
    return res.status(400).json({ error: "A 'topic' is required." });
  }

  const nodes = Array.isArray(req.body?.nodes)
    ? req.body.nodes
        .filter((node: { text?: string }) => node?.text)
        .slice(0, 60)
        .map((node: { id: unknown; text: unknown }) => ({
          id: String(node.id),
          text: String(node.text).slice(0, 300),
        }))
    : [];

  const text = typeof req.body?.text === "string" ? req.body.text.slice(0, 8000) : "";

  const result = await orchestrator.handle({
    topic: topic.slice(0, 200),
    userText: text,
    nodes,
  });

  const payload = result.payload as {
    score: number;
    summary: string;
    items: unknown[];
    followUp: string;
    modelAnswer: string;
  };

  return res.json({
    provider: result.provider,
    topicLabel: topic,
    score: payload.score,
    summary: payload.summary,
    items: payload.items,
    followUp: payload.followUp,
    modelAnswer: payload.modelAnswer,
    agent: result.agent,
    citations: result.citations,
  });
}

async function handlePracticeQueue(req: express.Request, res: express.Response) {
  const mastery =
    req.body?.mastery && typeof req.body.mastery === "object"
      ? (req.body.mastery as Record<string, number>)
      : {};

  const result = await orchestrator.handle({
    topic: String(req.body?.conceptId ?? req.body?.topic ?? "projectile-motion"),
    practiceMode: true,
    mastery,
  });

  const payload = result.payload as { question?: unknown };
  return res.json({
    question: payload.question ?? null,
    agent: result.agent,
    citations: result.citations,
  });
}

async function handlePracticeSet(_req: express.Request, res: express.Response) {
  const questions = loadPracticeSet();
  return res.json({
    setId: "default",
    title: "Practice Set",
    questions,
  });
}

async function handlePracticeCheck(req: express.Request, res: express.Response) {
  const questionId = String(req.body?.questionId ?? "");
  const selectedChoiceId = req.body?.selectedChoiceId
    ? String(req.body.selectedChoiceId)
    : undefined;
  const responseType = req.body?.responseType
    ? String(req.body.responseType)
    : undefined;

  if (responseType === "multiple_choice" && questionId && selectedChoiceId) {
    const questions = loadPracticeSet();
    const q = questions.find((p) => p.id === questionId);
    if (q && q.type === "multiple_choice") {
      const correct = selectedChoiceId === q.correctChoiceId;
      const rationale = q.choiceRationale?.[selectedChoiceId] ?? "";
      return res.json({
        score: correct ? 9 : 3,
        masteryDelta: correct ? 0.4 : -0.2,
        correct,
        correctChoiceId: q.correctChoiceId,
        rationale,
        agent: "coach",
        citations: [questionId],
      });
    }
  }

  const response = String(req.body?.response ?? "");
  const mastery =
    req.body?.mastery && typeof req.body.mastery === "object"
      ? (req.body.mastery as Record<string, number>)
      : {};

  const result = await orchestrator.handle({
    topic: String(req.body?.conceptId ?? "general"),
    userText: response,
    practiceMode: true,
    questionId: questionId || undefined,
    selectedChoiceId,
    responseType: responseType as "open_ended" | "multiple_choice" | undefined,
    mastery: { ...mastery, [req.body?.conceptId ?? "general"]: mastery[req.body?.conceptId] ?? 5 },
  });

  const payload = result.payload as {
    score?: number;
    masteryDelta?: number;
    question?: unknown;
    correct?: boolean;
    correctChoiceId?: string;
    rationale?: string;
  };

  return res.json({
    score: payload.score ?? 0,
    masteryDelta: payload.masteryDelta ?? 0,
    question: payload.question,
    correct: payload.correct,
    correctChoiceId: payload.correctChoiceId,
    rationale: payload.rationale,
    agent: result.agent,
    citations: result.citations,
  });
}

async function handlePracticeHint(req: express.Request, res: express.Response) {
  const result = await orchestrator.handle({
    topic: String(req.body?.conceptId ?? req.body?.topic ?? "projectile-motion"),
    hintRequest: true,
    userText: String(req.body?.hintIndex ?? "0"),
    mastery:
      req.body?.mastery && typeof req.body.mastery === "object"
        ? (req.body.mastery as Record<string, number>)
        : {},
  });

  const payload = result.payload as { question?: { hints?: string[] } };
  const hints = payload.question?.hints ?? [];

  return res.json({
    hint: hints[Number(req.body?.hintIndex ?? 0)] ?? hints[0] ?? "Break the problem into smaller steps.",
    hintCount: hints.length,
    agent: result.agent,
    citations: result.citations,
  });
}

app.post("/api/chat", handleChat);
app.post("/api/v1/chat", handleChat);
app.post("/api/feedback", handleFeedback);
app.post("/api/v1/feedback", handleFeedback);
app.get("/api/v1/practice/set", handlePracticeSet);
app.post("/api/v1/practice/queue", handlePracticeQueue);
app.post("/api/v1/practice/check", handlePracticeCheck);
app.post("/api/v1/practice/hint", handlePracticeHint);

const canvasDist = path.join(__dirname, "..", "..", "web-canvas", "dist");
if (existsSync(canvasDist)) {
  app.use(express.static(canvasDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(canvasDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[padhaaku-api] http://localhost:${PORT} (llm=${hasLlm()})`);
});
