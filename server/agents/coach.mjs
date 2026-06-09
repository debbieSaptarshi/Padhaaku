import { GENERIC_FOLLOWUPS, summaryFor } from "./assessor.mjs";
import { callLLMJson, hasLLM } from "../llm-client.mjs";

/**
 * Agent 4 — Socratic coaching: summary, follow-up, progressive model answer.
 * @param {import("../rag/types.mjs").AssessmentResult} assessment
 * @param {import("../rag/types.mjs").RetrievalResult} retrieval
 * @param {import("../rag/types.mjs").RouterResult} route
 * @param {import("../rag/types.mjs").FeedbackPayload} payload
 * @returns {Promise<import("../rag/types.mjs").CoachingResult>}
 */
export async function coachAgent(assessment, retrieval, route, payload) {
  const modelChunk = retrieval.chunks.find((h) => h.chunk.type === "model_answer");
  const topMissing = assessment.items.find((i) => i.kind === "missing");
  const modelAnswerText = modelChunk?.chunk.body || "";

  if (hasLLM() && (route.confidence !== "known" || assessment.score < 85)) {
    try {
      const context = retrieval.chunks
        .slice(0, 6)
        .map((h) => `[${h.chunk.type}] ${h.chunk.title}: ${h.chunk.body.slice(0, 280)}`)
        .join("\n");

      const llm = await callLLMJson({
        system: `You are Padhaaku's Coach Agent. Be warm, concise, and Socratic. Never dump the full answer unless the learner scored 85+. Reply with JSON only:
{ "summary": string, "followUp": string, "modelAnswer": string }`,
        user: `Topic: ${route.topicLabel}
Learner score: ${assessment.score}
Assessment items: ${JSON.stringify(assessment.items.slice(0, 8))}
Retrieved context:
${context || "(none)"}
Learner explanation:
${payload.text || "(mind map only)"}

Write summary (1-2 sentences), one probing followUp, and a modelAnswer that reveals only as much as their score warrants.`,
      });

      if (llm) {
        return {
          summary: llm.summary || summaryFor(assessment.score, assessment.items),
          followUp: llm.followUp || defaultFollowUp(topMissing, assessment.score),
          modelAnswer: progressiveModelAnswer(assessment.score, llm.modelAnswer || modelAnswerText),
        };
      }
    } catch (err) {
      console.error("[coach] LLM failed:", err.message);
    }
  }

  return {
    summary: summaryFor(assessment.score, assessment.items),
    followUp: defaultFollowUp(topMissing, assessment.score),
    modelAnswer: progressiveModelAnswer(assessment.score, modelAnswerText),
  };
}

function defaultFollowUp(topMissing, score) {
  if (topMissing?.detail) {
    return `${topMissing.detail} Can you add that to your explanation?`;
  }
  if (topMissing?.title) {
    return `What can you say about ${topMissing.title.replace(/^Missing:\s*/i, "")}?`;
  }
  if (score >= 60) {
    return "You've covered the essentials! Can you explain HOW these parts connect together?";
  }
  return GENERIC_FOLLOWUPS[Math.floor(Math.random() * GENERIC_FOLLOWUPS.length)];
}

function progressiveModelAnswer(score, fullAnswer) {
  if (!fullAnswer) {
    return "A strong explanation usually covers: what it is, the key parts or steps, why it happens, and a real example.";
  }
  if (score >= 85) return fullAnswer;
  if (score >= 60) return `${fullAnswer.split(". ").slice(0, 2).join(". ")}.`;
  if (score >= 30) return `${fullAnswer.split(". ")[0]}.`;
  return "Keep building your explanation — I'll reveal more as your score improves.";
}
