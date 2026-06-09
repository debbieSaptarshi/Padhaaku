import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { KnowledgeChunk, KnowledgeStore } from "@padhaaku/core";

type ConceptEntry = {
  aliases: string[];
  label: string;
  prerequisites?: string[];
  concepts: Array<{
    id: string;
    label: string;
    keywords: string[];
    hint: string;
    importance: number;
  }>;
  misconceptions: Array<{
    id: string;
    match: string[];
    label: string;
    correction: string;
  }>;
  modelAnswer: string;
};

type Choice = {
  id: string;
  label: string;
};

type PracticeEntryBase = {
  id: string;
  conceptId: string;
  subject: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  focusPoint: string;
  hints: string[];
  explanation: string;
};

type OpenEndedEntry = PracticeEntryBase & {
  type?: "open_ended";
  answerKeywords: string[];
};

type MultipleChoiceEntry = PracticeEntryBase & {
  type: "multiple_choice";
  choices: Choice[];
  correctChoiceId: string;
  choiceRationale?: Record<string, string>;
  answerKeywords?: string[];
};

type PracticeEntry = OpenEndedEntry | MultipleChoiceEntry;

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataRoot = join(__dirname, "..", "..", "..", "data", "seed");

function loadJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(dataRoot, filename), "utf8")) as T;
}

function topicChunks(topicId: string, entry: ConceptEntry): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  chunks.push({
    id: `${topicId}:model_answer`,
    topicId,
    type: "model_answer",
    text: entry.modelAnswer,
    keywords: entry.aliases,
    importance: 3,
    metadata: { label: entry.label, prerequisites: entry.prerequisites },
  });

  for (const concept of entry.concepts) {
    chunks.push({
      id: `${topicId}:concept:${concept.id}`,
      topicId,
      type: "concept",
      text: concept.hint,
      keywords: concept.keywords,
      importance: concept.importance,
      metadata: { label: concept.label, hint: concept.hint },
    });
  }

  for (const misconception of entry.misconceptions) {
    chunks.push({
      id: `${topicId}:misconception:${misconception.id}`,
      topicId,
      type: "misconception",
      text: misconception.correction,
      keywords: misconception.match,
      importance: 2,
      metadata: {
        label: misconception.label,
        correction: misconception.correction,
      },
    });
  }

  return chunks;
}

function practiceChunks(entry: PracticeEntry): KnowledgeChunk[] {
  const isMC = entry.type === "multiple_choice";
  const keywords = entry.answerKeywords ?? [];

  const chunks: KnowledgeChunk[] = [
    {
      id: entry.id,
      topicId: entry.conceptId,
      type: "question",
      text: entry.prompt,
      keywords,
      importance: 2,
      metadata: {
        subject: entry.subject,
        difficulty: entry.difficulty,
        answerKeywords: keywords,
        focusPoint: entry.focusPoint,
        questionType: isMC ? "multiple_choice" : "open_ended",
        ...(isMC && {
          choices: (entry as MultipleChoiceEntry).choices,
          correctChoiceId: (entry as MultipleChoiceEntry).correctChoiceId,
          choiceRationale: (entry as MultipleChoiceEntry).choiceRationale,
        }),
      },
    },
    {
      id: `${entry.id}:explanation`,
      topicId: entry.conceptId,
      type: "explanation",
      text: entry.explanation,
      keywords,
      importance: 2,
      metadata: { subject: entry.subject, difficulty: entry.difficulty },
    },
  ];

  entry.hints.forEach((hint, index) => {
    chunks.push({
      id: `${entry.id}:hint:${index}`,
      topicId: entry.conceptId,
      type: "hint",
      text: hint,
      keywords,
      importance: 1,
      metadata: {
        hint,
        subject: entry.subject,
        difficulty: entry.difficulty,
      },
    });
  });

  return chunks;
}

export function loadPracticeSet(): PracticeEntry[] {
  return loadJson<PracticeEntry[]>("practice.json");
}

export function buildKnowledgeStore(): KnowledgeStore {
  const concepts = loadJson<Record<string, ConceptEntry>>("concepts.json");
  const practice = loadJson<PracticeEntry[]>("practice.json");

  const topicIndex = new Map<string, ConceptEntry>();
  const aliasToTopicId = new Map<string, string>();
  const chunks: KnowledgeChunk[] = [];

  for (const [topicId, entry] of Object.entries(concepts)) {
    topicIndex.set(topicId, entry);
    for (const alias of entry.aliases) {
      aliasToTopicId.set(alias.toLowerCase(), topicId);
    }
    aliasToTopicId.set(topicId.toLowerCase(), topicId);
    aliasToTopicId.set(entry.label.toLowerCase(), topicId);
    chunks.push(...topicChunks(topicId, entry));
  }

  for (const entry of practice) {
    chunks.push(...practiceChunks(entry));
  }

  return {
    version: "0.2.0",
    getAllChunks() {
      return chunks;
    },
    getChunksByTopic(topicId: string) {
      return chunks.filter((chunk) => chunk.topicId === topicId);
    },
    findTopicId(topic: string) {
      const normalized = topic.trim().toLowerCase();
      if (!normalized) return null;

      if (aliasToTopicId.has(normalized)) {
        return aliasToTopicId.get(normalized) ?? null;
      }

      for (const [alias, topicId] of aliasToTopicId.entries()) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
          return topicId;
        }
      }

      return null;
    },
    getGraphNeighbors(topicId: string) {
      const entry = topicIndex.get(topicId);
      return entry?.prerequisites ?? [];
    },
    getTopicLabel(topicId: string | null, fallback: string) {
      if (!topicId) return fallback;
      return topicIndex.get(topicId)?.label ?? fallback;
    },
  };
}
