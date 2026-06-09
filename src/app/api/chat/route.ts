import { NextResponse } from "next/server";

import { getStudyBuddyReply, type StudyMessage } from "@/lib/study-buddy";

type ChatRequestBody = {
  message?: string;
  history?: StudyMessage[];
  context?: { mode?: string; topic?: string };
};

function extractExplainTopic(message: string): string | null {
  const match = message.match(
    /^(?:what is|what are|explain|help me understand|tell me about)\s+(.+?)\??$/i,
  );
  if (!match) return null;
  return match[1].trim();
}

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
  const result = await getStudyBuddyReply(message, history);

  const explainTopic = extractExplainTopic(message);
  const suggestExplain =
    body.context?.mode !== "explain" && explainTopic !== null;

  return NextResponse.json({
    ...result,
    suggestExplain,
    explainTopic: explainTopic ?? undefined,
  });
}
