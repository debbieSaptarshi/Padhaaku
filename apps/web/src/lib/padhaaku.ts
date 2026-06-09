import { PadhaakuOrchestrator } from "@padhaaku/core";
import { allAgents } from "@padhaaku/agents";
import { getKnowledgeStore } from "@padhaaku/knowledge";
import { createHybridRetriever } from "@padhaaku/rag";

let orchestrator: PadhaakuOrchestrator | null = null;

export function getOrchestrator(): PadhaakuOrchestrator {
  if (!orchestrator) {
    const store = getKnowledgeStore();
    orchestrator = new PadhaakuOrchestrator({
      retriever: createHybridRetriever(store),
      agents: allAgents,
      useLlm: Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
    });
  }
  return orchestrator;
}

export function hasLlm(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}
