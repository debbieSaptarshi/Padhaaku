import { NextResponse } from "next/server";

import { getOrchestrator } from "@/lib/padhaaku";
import type { StudyMessage } from "@padhaaku/core";

type ChatRequestBody = {
  message?: string;
  history?: StudyMessage[];
};

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const result = await getOrchestrator().handle({ message, history });

  if (result.agent !== "explainer" || !("reply" in result.payload)) {
    return NextResponse.json({ error: "Unexpected agent response" }, { status: 500 });
  }

  return NextResponse.json({
    reply: result.payload.reply,
    mode: result.payload.mode,
    agent: result.agent,
    citations: result.citations,
  });
}
