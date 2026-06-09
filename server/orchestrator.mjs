import { AGENTS } from "./agent-registry.mjs";

function nowMs() {
  return Number(process.hrtime.bigint() / 1_000_000n);
}

/**
 * Run the 4-agent Hybrid RAG pipeline and return the shared Feedback contract.
 * @param {import("./rag/types.mjs").FeedbackPayload} payload
 * @returns {Promise<import("./rag/types.mjs").FeedbackResponse>}
 */
export async function runFeedbackPipeline(payload) {
  /** @type {import("./rag/types.mjs").PipelineState} */
  const state = { payload };
  /** @type {{ agent: string, ms: number }[]} */
  const pipeline = [];

  for (const agent of AGENTS) {
    const start = nowMs();
    if (agent.id === "router") {
      state.route = agent.run(payload);
    } else if (agent.id === "retriever") {
      state.retrieval = await agent.run(state.route, payload);
    } else if (agent.id === "assessor") {
      state.assessment = agent.run(payload, state.retrieval, state.route);
    } else if (agent.id === "coach") {
      state.coaching = await agent.run(state.assessment, state.retrieval, state.route, payload);
    }
    pipeline.push({ agent: agent.id, ms: nowMs() - start });
  }

  return {
    provider: `hybrid-rag:${state.retrieval.mode}`,
    topicLabel: state.assessment.topicLabel,
    score: state.assessment.score,
    summary: state.coaching.summary,
    items: state.assessment.items,
    followUp: state.coaching.followUp,
    modelAnswer: state.coaching.modelAnswer,
    pipeline,
  };
}

export function isHybridRagEnabled() {
  return process.env.PADHAAKU_DISABLE_HYBRID_RAG !== "1";
}
