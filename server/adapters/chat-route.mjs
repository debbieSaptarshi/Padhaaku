import { runFeedbackPipeline } from "../orchestrator.mjs";
import { chatToFeedbackPayload, feedbackToChatReply } from "../shared/feedback-contract.mjs";

/**
 * Shared handler for chat-style prototypes (Next.js /api/chat).
 * Returns the same coaching content as /api/feedback but as markdown.
 */
export async function handleChatStudyRequest(body) {
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return { status: 400, body: { error: "A 'message' is required." } };
  }

  const payload = chatToFeedbackPayload(body);
  const feedback = await runFeedbackPipeline(payload);

  return {
    status: 200,
    body: {
      reply: feedbackToChatReply(feedback),
      mode: "hybrid-rag",
      feedback,
    },
  };
}
