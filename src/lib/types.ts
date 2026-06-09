export type FeedbackKind = "good" | "incomplete" | "misconception" | "missing";

export interface FeedbackItem {
  kind: FeedbackKind;
  title: string;
  detail: string;
  nodeId: string | null;
  span: string | null;
  /** Chunk id from the Hybrid RAG knowledge bank, when grounded. */
  source?: string;
}

export interface Feedback {
  provider: string;
  topicLabel: string;
  score: number;
  summary: string;
  items: FeedbackItem[];
  followUp: string;
  modelAnswer: string;
  /** Per-agent timings when served by the Hybrid RAG orchestrator. */
  pipeline?: { agent: string; ms: number }[];
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
