import type { KnowledgeChunk } from "@padhaaku/core";

export type ConceptEntry = {
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

export type PracticeQuestionSeed = {
  id: string;
  conceptId: string;
  subject: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  answerKeywords: string[];
  focusPoint: string;
  hints: string[];
  explanation: string;
};

export function conceptsToChunks(topics: Record<string, ConceptEntry>): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  for (const [topicId, entry] of Object.entries(topics)) {
    for (const c of entry.concepts) {
      chunks.push({
        id: `${topicId}:concept:${c.id}`,
        topicId,
        type: "concept",
        text: c.label,
        keywords: c.keywords,
        importance: c.importance,
        metadata: {
          label: c.label,
          hint: c.hint,
          prerequisites: entry.prerequisites,
        },
      });
    }

    for (const m of entry.misconceptions) {
      chunks.push({
        id: `${topicId}:misconception:${m.id}`,
        topicId,
        type: "misconception",
        text: m.correction,
        keywords: m.match,
        importance: 3,
        metadata: {
          label: m.label,
          correction: m.correction,
        },
      });
    }

    chunks.push({
      id: `${topicId}:model_answer`,
      topicId,
      type: "model_answer",
      text: entry.modelAnswer,
      keywords: entry.aliases,
      importance: 3,
      metadata: { label: entry.label },
    });
  }

  return chunks;
}

export function questionsToChunks(questions: PracticeQuestionSeed[]): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  for (const q of questions) {
    chunks.push({
      id: q.id,
      topicId: q.conceptId,
      type: "question",
      text: q.prompt,
      keywords: q.answerKeywords,
      importance: q.difficulty,
      metadata: {
        subject: q.subject,
        difficulty: q.difficulty,
        answerKeywords: q.answerKeywords,
        focusPoint: q.focusPoint,
      },
    });

    q.hints.forEach((hint, i) => {
      chunks.push({
        id: `${q.id}:hint:${i}`,
        topicId: q.conceptId,
        type: "hint",
        text: hint,
        keywords: [],
        importance: 2,
        metadata: { hint },
      });
    });

    chunks.push({
      id: `${q.id}:explanation`,
      topicId: q.conceptId,
      type: "explanation",
      text: q.explanation,
      keywords: q.answerKeywords,
      importance: 2,
      metadata: { subject: q.subject },
    });
  }

  return chunks;
}
