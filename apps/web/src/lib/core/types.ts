export type StudyMode = "ask" | "explain" | "practice";

export type FeedbackKind = "good" | "incomplete" | "misconception" | "missing";

export interface FeedbackItem {
  kind: FeedbackKind;
  title: string;
  detail: string;
  nodeId: string | null;
  span: string | null;
}

export interface Feedback {
  provider: string;
  topicLabel: string;
  score: number;
  scoreDelta?: number;
  summary: string;
  items: FeedbackItem[];
  followUp: string;
  modelAnswer: string;
  modelAnswerUnlocked?: boolean;
  roundNumber?: number;
}

export type InputMode = "mindmap" | "text";

export interface MindNode {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface MindEdge {
  id: string;
  from: string;
  to: string;
}

export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

export interface TopicContext {
  topicId: string;
  topicLabel: string;
  mode: StudyMode;
  sessionId: string;
}

export interface PedagogyPolicy {
  allowModelAnswer: boolean;
  allowDirectAnswer: boolean;
  minRoundsBeforeReveal: number;
  unlockScoreThreshold: number;
}

export interface StudyContext {
  mode: StudyMode;
  topic?: string;
  currentScore?: number;
  roundNumber?: number;
  missingConcepts?: string[];
}
