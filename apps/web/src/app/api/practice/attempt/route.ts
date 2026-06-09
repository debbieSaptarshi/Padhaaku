import { NextResponse } from "next/server";

import { getOrchestrator } from "@/lib/padhaaku";

type AttemptBody = {
  topic?: string;
  questionId?: string;
  response?: string;
  hintCount?: number;
  mastery?: Record<string, number>;
};

export async function POST(request: Request) {
  let body: AttemptBody;
  try {
    body = (await request.json()) as AttemptBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const response = body.response?.trim();
  if (!response) {
    return NextResponse.json({ error: "Response is required" }, { status: 400 });
  }

  const result = await getOrchestrator().handle({
    topic: body.topic ?? body.questionId ?? "practice",
    userText: response,
    practiceMode: true,
    mastery: body.mastery,
  });

  const explanation =
    "question" in result.payload && result.payload.question?.explanation
      ? result.payload.question.explanation
      : undefined;

  return NextResponse.json({
    agent: result.agent,
    citations: result.citations,
    score: "score" in result.payload ? result.payload.score : 0,
    masteryDelta: "masteryDelta" in result.payload ? result.payload.masteryDelta : 0,
    hintCount: body.hintCount ?? 0,
    explanation,
  });
}
