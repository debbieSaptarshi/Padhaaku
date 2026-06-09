import { NextResponse } from "next/server";

import { getOrchestrator } from "@/lib/padhaaku";

type FeedbackRequestBody = {
  topic?: string;
  mode?: "mindmap" | "text";
  text?: string;
  nodes?: Array<{ id: string; text: string }>;
};

export async function POST(request: Request) {
  let body: FeedbackRequestBody;
  try {
    body = (await request.json()) as FeedbackRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topic = body.topic?.trim();
  if (!topic) {
    return NextResponse.json({ error: "A 'topic' is required." }, { status: 400 });
  }

  const nodes = Array.isArray(body.nodes)
    ? body.nodes
        .filter((n) => n && n.text)
        .slice(0, 60)
        .map((n) => ({ id: String(n.id), text: String(n.text).slice(0, 300) }))
    : [];

  const text = typeof body.text === "string" ? body.text.slice(0, 8000) : "";

  const result = await getOrchestrator().handle({
    topic,
    userText: text,
    nodes,
  });

  if (!("score" in result.payload)) {
    return NextResponse.json({ error: "Unexpected agent response" }, { status: 500 });
  }

  return NextResponse.json({
    provider: result.provider,
    topicLabel: topic,
    agent: result.agent,
    citations: result.citations,
    ...result.payload,
  });
}
