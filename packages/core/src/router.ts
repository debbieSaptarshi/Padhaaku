import type { AgentIntent, AgentName, StudyMessage } from "./types.js";

export type RouteInput = {
  message?: string;
  topic?: string;
  userText?: string;
  nodes?: unknown[];
  practiceMode?: boolean;
  hintRequest?: boolean;
};

/**
 * Rule-based intent router. Maps user signals to agent + retrieval intent.
 * Upgrade to a classifier once traffic justifies it.
 */
export function routeIntent(input: RouteInput): {
  agent: AgentName;
  intent: AgentIntent;
} {
  if (input.practiceMode || input.hintRequest) {
    return {
      agent: "coach",
      intent: input.hintRequest ? "hint" : "practice",
    };
  }

  const hasLearnerExplanation =
    Boolean(input.userText?.trim()) || (input.nodes?.length ?? 0) > 0;

  if (hasLearnerExplanation && input.topic) {
    return { agent: "socratic", intent: "assess" };
  }

  if (input.message?.trim()) {
    return { agent: "explainer", intent: "explain" };
  }

  return { agent: "explainer", intent: "explain" };
}

/** Pick fallback agent when primary LLM path fails. */
export function fallbackAgent(primary: AgentName): AgentName {
  if (primary === "socratic") return "analyzer";
  if (primary === "explainer") return "analyzer";
  return primary;
}

export function buildRetrievalQuery(
  intent: AgentIntent,
  topic: string,
  userText?: string,
  history?: StudyMessage[],
): string {
  const parts = [topic];
  if (userText?.trim()) parts.push(userText.trim());
  if (intent === "explain" && history?.length) {
    parts.push(history[history.length - 1]?.content ?? "");
  }
  return parts.join(" ").slice(0, 2000);
}
