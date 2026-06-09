import { findTopic, TOPICS } from "../concepts.mjs";

/**
 * @param {import("./types.mjs").FeedbackPayload} payload
 * @returns {import("./types.mjs").QueryPlan}
 */
export function planQuery(payload) {
  const topicQ = payload.topic.trim();
  const textQ = (payload.text || "").trim();
  const nodeTexts = (payload.nodes || []).map((n) => n.text).filter(Boolean);
  const nodeBlock = nodeTexts.join(" | ");

  let topicKey = null;
  const entry = findTopic(topicQ);
  if (entry) {
    topicKey = Object.entries(TOPICS).find(([, v]) => v === entry)?.[0] ?? null;
  }

  const semanticParts = [`Topic: ${topicQ}`];
  if (textQ) semanticParts.push(`Learner explanation: ${textQ}`);
  if (nodeBlock) semanticParts.push(`Mind map: ${nodeBlock}`);

  return {
    intent: "assess_understanding",
    topic: topicQ,
    topicKey,
    queries: [
      { text: topicQ, weight: 1, role: "topic" },
      { text: semanticParts.join("\n"), weight: 0.7, role: "semantic" },
      { text: [topicQ, textQ, ...nodeTexts].join(" "), weight: 0.8, role: "sparse" },
      { text: textQ || nodeBlock, weight: 0.9, role: "misconception" },
    ],
    filters: {
      topicKey,
      types: ["concept", "misconception", "model_answer", "topic_overview"],
    },
    topK: 20,
  };
}
