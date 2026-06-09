import conceptsData from "../../../data/seed/concepts.json";
import questionsData from "../../../data/seed/questions.json";
import { createKnowledgeStore } from "./store";
import type { ConceptEntry, PracticeQuestionSeed } from "./ingest";

export const GENERIC_FOLLOWUPS = [
  "Can you explain WHY that happens, not just what happens?",
  "What would a simple real-world example of this look like?",
  "What are the key parts or steps involved?",
  "What causes it, and what is the result?",
  "If you had to teach this to a 10-year-old, what would you say?",
];

let storeInstance: ReturnType<typeof createKnowledgeStore> | null = null;

export function getKnowledgeStore() {
  if (!storeInstance) {
    storeInstance = createKnowledgeStore(
      conceptsData as Record<string, ConceptEntry>,
      questionsData as PracticeQuestionSeed[],
      GENERIC_FOLLOWUPS,
    );
  }
  return storeInstance;
}
