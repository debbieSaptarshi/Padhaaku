import { NextResponse } from "next/server";

import { getOrchestrator } from "@/lib/padhaaku";

type PracticeNextBody = {
  mastery?: Record<string, number>;
  topic?: string;
};

export async function POST(request: Request) {
  let body: PracticeNextBody = {};
  try {
    body = (await request.json()) as PracticeNextBody;
  } catch {
    // empty body is fine
  }

  const result = await getOrchestrator().handle({
    topic: body.topic ?? "practice",
    practiceMode: true,
    mastery: body.mastery,
  });

  if (!("question" in result.payload) || !result.payload.question) {
    return NextResponse.json({ error: "No practice questions available" }, { status: 404 });
  }

  return NextResponse.json({
    agent: result.agent,
    citations: result.citations,
    question: result.payload.question,
  });
}
