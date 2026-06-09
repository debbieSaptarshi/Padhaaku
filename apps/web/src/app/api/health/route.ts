import { NextResponse } from "next/server";

import { getKnowledgeStore } from "@padhaaku/knowledge";
import { hasLlm } from "@/lib/padhaaku";

export async function GET() {
  const store = getKnowledgeStore();
  const chunks = store.getAllChunks();

  return NextResponse.json({
    ok: true,
    llm: hasLlm(),
    rag: {
      chunks: chunks.length,
      topics: new Set(chunks.map((c) => c.topicId)).size,
      dense: Boolean(process.env.PINECONE_API_KEY),
    },
    agents: ["explainer", "socratic", "analyzer", "coach"],
  });
}
