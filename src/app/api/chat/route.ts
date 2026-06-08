import { NextResponse } from "next/server";

import { getStudyBuddyReply, type StudyMessage } from "@/lib/study-buddy";

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
  const result = await getStudyBuddyReply(message, history);

  return NextResponse.json(result);
}
