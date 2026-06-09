import type { AgentIntent, RetrievalContext } from "./types.js";

export type GradeResult = {
  pass: boolean;
  relevanceScore: number;
  coverageGaps: string[];
  suggestedQueryRewrite?: string;
};

/** CRAG-style gate before dispatching to product agents. */
export function gradeRetrieval(
  intent: AgentIntent,
  retrieval: RetrievalContext,
): GradeResult {
  const chunkCount = retrieval.chunks.length;
  const hasModelAnswer = retrieval.chunks.some((c) => c.type === "model_answer");
  const hasConcepts = retrieval.chunks.some((c) => c.type === "concept");
  const hasQuestion = retrieval.chunks.some((c) => c.type === "question");

  let relevanceScore = Math.min(1, chunkCount / 4);

  if (intent === "explain" && hasModelAnswer) relevanceScore += 0.25;
  if (intent === "assess" && (hasConcepts || hasModelAnswer)) relevanceScore += 0.25;
  if ((intent === "practice" || intent === "hint") && hasQuestion) relevanceScore += 0.3;

  relevanceScore = Math.min(1, relevanceScore);

  const coverageGaps: string[] = [];
  if (intent === "explain" && !hasModelAnswer) {
    coverageGaps.push("No model answer chunk retrieved for this topic.");
  }
  if (intent === "assess" && !hasConcepts) {
    coverageGaps.push("No concept chunks retrieved to assess against.");
  }
  if ((intent === "practice" || intent === "hint") && !hasQuestion) {
    coverageGaps.push("No practice question retrieved for this concept.");
  }

  const pass =
    relevanceScore >= 0.35 ||
    (intent === "assess" && chunkCount > 0) ||
    (intent === "explain" && chunkCount > 0);

  return {
    pass,
    relevanceScore,
    coverageGaps,
    suggestedQueryRewrite: pass
      ? undefined
      : `Explain the core ideas of ${retrieval.topicLabel}`,
  };
}
