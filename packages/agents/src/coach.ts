import type { AgentRequest, AgentResponse, PadhaakuAgent, PracticeQuestion } from "@padhaaku/core";

function questionFromChunks(request: AgentRequest): PracticeQuestion | null {
  const questionChunk = [...request.retrieval.chunks]
    .filter((c) => c.type === "question")
    .sort(
      (a, b) =>
        (request.retrieval.fusionScores[b.id] ?? 0) -
        (request.retrieval.fusionScores[a.id] ?? 0),
    )[0];
  if (!questionChunk) return null;

  const hints = request.retrieval.chunks
    .filter((c) => c.type === "hint" && c.topicId === questionChunk.topicId)
    .map((c) => c.text);

  const explanation =
    request.retrieval.chunks.find(
      (c) => c.type === "explanation" && c.id.startsWith(questionChunk.id),
    )?.text ?? "";

  return {
    id: questionChunk.id,
    conceptId: questionChunk.topicId,
    subject: questionChunk.metadata.subject ?? "General",
    difficulty: questionChunk.metadata.difficulty ?? 2,
    prompt: questionChunk.text,
    hints: hints.length ? hints : ["Break the problem into smaller steps."],
    explanation,
  };
}

function scoreResponse(response: string, keywords: string[]): number {
  const normalized = response.toLowerCase();
  const matches = keywords.filter((k) => normalized.includes(k.toLowerCase()));
  if (matches.length === 0) return 2;
  const raw = Math.round((matches.length / keywords.length) * 10);
  return Math.max(4, Math.min(10, raw));
}

export const coachAgent: PadhaakuAgent = {
  name: "coach",
  async run(request): Promise<AgentResponse> {
    if (request.intent === "hint") {
      const question = questionFromChunks(request);
      return {
        agent: "coach",
        provider: "local",
        payload: { question: question ?? undefined },
        citations: request.retrieval.chunks.map((c) => c.id),
      };
    }

    // practice/attempt — if userText provided, score the attempt
    if (request.userText?.trim()) {
      const questionChunk = request.retrieval.chunks.find((c) => c.type === "question");
      const keywords = questionChunk?.metadata.answerKeywords ?? questionChunk?.keywords ?? [];
      const score = scoreResponse(request.userText, keywords);
      const masteryDelta = score >= 7 ? 0.4 : score >= 5 ? 0.2 : 0.1;
      const explanation =
        request.retrieval.chunks.find((c) => c.type === "explanation")?.text ?? "";

      return {
        agent: "coach",
        provider: "local",
        payload: { score, masteryDelta, question: questionFromChunks(request) ?? undefined },
        citations: request.retrieval.chunks.map((c) => c.id),
      };
    }

    const question = questionFromChunks(request);
    return {
      agent: "coach",
      provider: "local",
      payload: { question: question ?? undefined },
      citations: request.retrieval.chunks.map((c) => c.id),
    };
  },
};
