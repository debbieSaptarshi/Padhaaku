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
  scoreDelta: number | null;
  summary: string;
  items: FeedbackItem[];
  followUp: string;
  modelAnswer: string | null;
  modelAnswerLocked: boolean;
  unlockHint: string | null;
  masteryReached: boolean;
  attemptNumber: number;
}

export type InputMode = "mindmap" | "text" | "handwriting";

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

export interface Attempt {
  id: string;
  score: number;
  timestamp: number;
  mode: InputMode;
}

export interface SessionDraft {
  topic: string;
  mode: InputMode;
  nodes: MindNode[];
  edges: MindEdge[];
  strokes: Stroke[];
  text: string;
  handwritingStrokes: Stroke[];
  handwritingCaption: string;
  attempts: Attempt[];
  sessionStartedAt: number;
  updatedAt: number;
}

export const MASTERY_THRESHOLD = 75;
export const MODEL_UNLOCK_ATTEMPTS = 2;
export const MODEL_UNLOCK_SCORE = 60;
export const MODEL_UNLOCK_MS = 3 * 60 * 1000;
