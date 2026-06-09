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
