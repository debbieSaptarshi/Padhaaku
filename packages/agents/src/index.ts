export { explainerAgent } from "./explainer";
export { socraticAgent } from "./socratic";
export { analyzerAgent } from "./analyzer";
export { coachAgent } from "./coach";

import { explainerAgent } from "./explainer";
import { socraticAgent } from "./socratic";
import { analyzerAgent } from "./analyzer";
import { coachAgent } from "./coach";

export const allAgents = {
  explainer: explainerAgent,
  socratic: socraticAgent,
  analyzer: analyzerAgent,
  coach: coachAgent,
};
