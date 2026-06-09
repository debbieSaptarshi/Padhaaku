export type FeedbackKind = "good" | "incomplete" | "misconception" | "missing";

export interface FeedbackItem {
  kind: FeedbackKind;
  title: string;
  detail: string;
  nodeId: string | null;
  span: string | null;
}

export interface SuggestedNode {
  label: string;
  hint: string;
}

export interface MasteryInfo {
  achieved: boolean;
  threshold: number;
}

export interface Feedback {
  provider: string;
  topicLabel: string;
  score: number;
  previousScore: number | null;
  attemptNumber: number;
  summary: string;
  items: FeedbackItem[];
  followUp: string;
  modelAnswer: string | null;
  suggestedNodes: SuggestedNode[];
  mastery: MasteryInfo;
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

export interface CanvasState {
  nodes: MindNode[];
  edges: MindEdge[];
  strokes: Stroke[];
}

export interface SessionAttempt {
  at: string;
  score: number;
  itemCount: {
    good: number;
    missing: number;
    misconception: number;
  };
}

export interface SessionSnapshot {
  topic: string;
  mode: InputMode;
  nodes: MindNode[];
  edges: MindEdge[];
  strokes: Stroke[];
  text: string;
  attempts: SessionAttempt[];
  lastFeedback: Feedback | null;
  attemptNumber: number;
  onboardingDone: boolean;
}

export interface TopicPack {
  id: string;
  label: string;
  topics: { key: string; label: string }[];
}

export interface TopicsResponse {
  packs: TopicPack[];
  total: number;
}
