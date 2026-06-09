import { fallbackAgent, buildRetrievalQuery, routeIntent, type RouteInput } from "./router.js";
import { gradeRetrieval } from "./grader.js";
import type {
  AgentRequest,
  AgentResponse,
  PadhaakuAgent,
  RetrievalContext,
} from "./types.js";

export type HybridRetriever = {
  retrieve(params: {
    topic: string;
    query: string;
    intent: AgentRequest["intent"];
    mastery?: Record<string, number>;
  }): Promise<RetrievalContext>;
};

export type OrchestratorConfig = {
  retriever: HybridRetriever;
  agents: Record<string, PadhaakuAgent>;
  useLlm: boolean;
};

/**
 * Central orchestrator: route → retrieve → grade → dispatch → fallback.
 * All four Padhaaku agents share the same Hybrid RAG retrieval context.
 */
export class PadhaakuOrchestrator {
  constructor(private readonly config: OrchestratorConfig) {}

  async handle(
    input: RouteInput & {
      history?: AgentRequest["history"];
      mastery?: Record<string, number>;
    },
  ): Promise<AgentResponse> {
    const topic = input.topic ?? extractTopicFromMessage(input.message ?? "");
    const { agent: primaryAgent, intent } = routeIntent(input);

    let query = buildRetrievalQuery(intent, topic, input.userText, input.history);
    let retrieval = await this.config.retriever.retrieve({
      topic,
      query,
      intent,
      mastery: input.mastery,
    });

    let grade = gradeRetrieval(intent, retrieval);
    let retries = 0;
    while (!grade.pass && grade.suggestedQueryRewrite && retries < 1) {
      query = grade.suggestedQueryRewrite;
      retrieval = await this.config.retriever.retrieve({
        topic,
        query,
        intent,
        mastery: input.mastery,
      });
      grade = gradeRetrieval(intent, retrieval);
      retries += 1;
    }

    const request: AgentRequest = {
      intent,
      topic,
      userText: input.userText,
      nodes: input.nodes as AgentRequest["nodes"],
      history: input.history,
      mastery: input.mastery,
      retrieval,
    };

    const agent = this.config.agents[primaryAgent];
    if (!agent) {
      throw new Error(`Agent not registered: ${primaryAgent}`);
    }

    try {
      if (!this.config.useLlm && primaryAgent === "socratic") {
        return await this.config.agents.analyzer.run(request);
      }
      return await agent.run(request);
    } catch {
      const fb = fallbackAgent(primaryAgent);
      const fallback = this.config.agents[fb];
      if (!fallback) throw new Error(`Fallback agent not registered: ${fb}`);
      return fallback.run(request);
    }
  }
}

function extractTopicFromMessage(message: string): string {
  const cleaned = message
    .replace(/^(what is|what are|explain|help me understand|tell me about|quiz me on)\s+/i, "")
    .replace(/\?+$/, "")
    .trim();
  return cleaned || message.trim() || "general";
}
