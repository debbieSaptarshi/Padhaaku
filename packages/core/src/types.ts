/** Shared types for Padhaaku's four-agent Hybrid RAG system. */

export type AgentName = "explainer" | "socratic" | "analyzer" | "coach";

export type AgentIntent = "explain" | "assess" | "practice" | "hint";

export type KnowledgeChunkType =
  | "concept"
  | "misconception"
  | "model_answer"
  | "hint"
  | "question"
  | "explanation"
  | "learner_attempt";

export type KnowledgeChunk = {
  id: string;
  topicId: string;
  type: KnowledgeChunkType;
  text: string;
  keywords: string[];
  importance: number;
  metadata: {
    label?: string;
    hint?: string;
    correction?: string;
    difficulty?: 1 | 2 | 3;
    subject?: string;
    prerequisites?: string[];
    answerKeywords?: string[];
    focusPoint?: string;
  };
};

export type RetrievalContext = {
  topicId: string | null;
  topicLabel: string;
  chunks: KnowledgeChunk[];
  fusionScores: Record<string, number>;
  graphNeighbors: string[];
};

export type StudyMessage = {
  role: "user" | "assistant";
  content: string;
};

export type MindNode = {
  id: string;
  text: string;
};

export type AgentRequest = {
  intent: AgentIntent;
  topic: string;
  userText?: string;
  nodes?: MindNode[];
  history?: StudyMessage[];
  mastery?: Record<string, number>;
  retrieval: RetrievalContext;
};

export type FeedbackKind = "good" | "incomplete" | "misconception" | "missing";

export type FeedbackItem = {
  kind: FeedbackKind;
  title: string;
  detail: string;
  nodeId: string | null;
  span: string | null;
};

export type ExplainerPayload = {
  reply: string;
  mode: "offline" | "openai" | "anthropic";
};

export type FeedbackPayload = {
  score: number;
  summary: string;
  items: FeedbackItem[];
  followUp: string;
  modelAnswer: string;
};

export type PracticeQuestion = {
  id: string;
  conceptId: string;
  subject: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  hints: string[];
  explanation: string;
};

export type PracticePayload = {
  question?: PracticeQuestion;
  score?: number;
  masteryDelta?: number;
};

export type AgentResponse = {
  agent: AgentName;
  provider: "openai" | "anthropic" | "local" | "offline";
  payload: ExplainerPayload | FeedbackPayload | PracticePayload;
  citations: string[];
};

export interface PadhaakuAgent {
  readonly name: AgentName;
  run(request: AgentRequest): Promise<AgentResponse>;
}
