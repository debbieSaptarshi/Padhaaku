/**
 * Shared API contract used by parallel Padhaaku surfaces:
 * - learning-canvas (POST /api/feedback)
 * - next-chat prototype (POST /api/chat → can call runFeedbackPipeline)
 * - expo prototype (future mobile client)
 */

/**
 * @param {unknown} body
 * @returns {{ ok: true, payload: import("../rag/types.mjs").FeedbackPayload } | { ok: false, error: string }}
 */
export function normalizeFeedbackRequest(body) {
  const { topic, mode, text, nodes } = body || {};
  if (!topic || typeof topic !== "string") {
    return { ok: false, error: "A 'topic' is required." };
  }

  return {
    ok: true,
    payload: {
      topic: topic.slice(0, 200),
      mode: mode === "mindmap" ? "mindmap" : "text",
      text: typeof text === "string" ? text.slice(0, 8000) : "",
      nodes: Array.isArray(nodes)
        ? nodes
            .filter((n) => n && n.text)
            .slice(0, 60)
            .map((n) => ({ id: String(n.id), text: String(n.text).slice(0, 300) }))
        : [],
    },
  };
}

/**
 * Adapt a chat-style question into a feedback payload for the shared pipeline.
 * @param {{ message: string, topic?: string }} body
 */
export function chatToFeedbackPayload(body) {
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const topic =
    typeof body?.topic === "string" && body.topic.trim()
      ? body.topic.trim()
      : extractTopicFromQuestion(message);

  return {
    topic: topic.slice(0, 200),
    mode: "text",
    text: message.slice(0, 8000),
    nodes: [],
  };
}

function extractTopicFromQuestion(question) {
  const cleaned = question
    .replace(/^(what is|what are|explain|help me understand|tell me about)\s+/i, "")
    .replace(/\?+$/, "")
    .trim();
  return cleaned.length > 0 ? cleaned : question.trim() || "General topic";
}

/**
 * Convert pipeline feedback into a markdown chat reply for the Next.js prototype.
 * @param {import("../rag/types.mjs").FeedbackResponse} feedback
 */
export function feedbackToChatReply(feedback) {
  const lines = [
    `## ${feedback.topicLabel}`,
    "",
    `**Understanding score:** ${feedback.score}/100`,
    "",
    feedback.summary,
    "",
  ];

  if (feedback.items.length) {
    lines.push("**Feedback**");
    for (const item of feedback.items.slice(0, 6)) {
      const icon =
        item.kind === "good"
          ? "✅"
          : item.kind === "misconception"
            ? "⚠️"
            : item.kind === "missing"
              ? "➕"
              : "💡";
      lines.push(`- ${icon} **${item.title}** — ${item.detail}`);
    }
    lines.push("");
  }

  lines.push("**Think about this**", feedback.followUp, "");
  if (feedback.modelAnswer) {
    lines.push("**Model answer (progressive)**", feedback.modelAnswer);
  }

  return lines.join("\n");
}
