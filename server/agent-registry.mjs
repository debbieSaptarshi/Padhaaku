import { routerAgent } from "./agents/router.mjs";
import { retrieverAgent } from "./agents/retriever.mjs";
import { assessorAgent } from "./agents/assessor.mjs";
import { coachAgent } from "./agents/coach.mjs";

/**
 * Canonical registry for the four parallel Padhaaku agents.
 * Each agent is independently swappable/testable while sharing PipelineState.
 */
export const AGENTS = [
  {
    id: "router",
    name: "Router Agent",
    order: 1,
    description: "Resolves topic and shapes retrieval queries.",
    run: routerAgent,
    sync: true,
  },
  {
    id: "retriever",
    name: "Retriever Agent",
    order: 2,
    description: "Hybrid sparse + dense retrieval with RRF fusion.",
    run: retrieverAgent,
    sync: false,
  },
  {
    id: "assessor",
    name: "Assessor Agent",
    order: 3,
    description: "Grades learner explanation against retrieved evidence.",
    run: assessorAgent,
    sync: true,
  },
  {
    id: "coach",
    name: "Coach Agent",
    order: 4,
    description: "Socratic summary, follow-up, and progressive model answer.",
    run: coachAgent,
    sync: false,
  },
];

export function getAgent(id) {
  const agent = AGENTS.find((a) => a.id === id);
  if (!agent) throw new Error(`Unknown agent: ${id}`);
  return agent;
}
