import { NextResponse } from "next/server";

import { analyzeLocally } from "../../../../server/analyzer.mjs";
import { analyzeWithLLM, hasLLM } from "../../../../server/llm.mjs";
import {
  enrichFeedback,
  sanitizeFollowUp,
} from "@/lib/server/enrich-feedback";

type FeedbackBody = {
  topic?: string;
  mode?: string;
  text?: string;
  nodes?: Array<{ id?: string; text?: string }>;
  roundNumber?: number;
  previousScore?: number | null;
  sessionId?: string;
};

export async function POST(request: Request) {
  let body: FeedbackBody;

  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topic = body.topic?.trim();
  if (!topic) {
    return NextResponse.json({ error: "A 'topic' is required." }, { status: 400 });
  }

  const roundNumber = Math.max(1, Number(body.roundNumber) || 1);
  const previousScore =
    body.previousScore === null || body.previousScore === undefined
      ? null
      : Number(body.previousScore);

  const payload = {
    topic: topic.slice(0, 200),
    mode: body.mode === "mindmap" ? "mindmap" : "text",
    text: typeof body.text === "string" ? body.text.slice(0, 8000) : "",
    nodes: Array.isArray(body.nodes)
      ? body.nodes
          .filter((n) => n && n.text)
          .slice(0, 60)
          .map((n) => ({
            id: String(n.id),
            text: String(n.text).slice(0, 300),
          }))
      : [],
  };

  let result = null;

  if (hasLLM()) {
    try {
      result = await analyzeWithLLM(payload);
    } catch (err) {
      console.error("[feedback] LLM fallback:", err);
    }
  }

  if (!result) {
    result = analyzeLocally(payload);
  }

  result = {
    ...result,
    followUp: sanitizeFollowUp(result.followUp),
  };

  const enriched = enrichFeedback(result, {
    roundNumber,
    previousScore,
  } as { roundNumber: number; previousScore: number | null });

  return NextResponse.json({
    ...enriched,
    sessionId: body.sessionId ?? null,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, llm: hasLLM() });
}
