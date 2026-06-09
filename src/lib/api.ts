import type { Feedback, InputMode, MindEdge, MindNode, TopicsResponse } from "./types";

export interface FeedbackRequest {
  topic: string;
  mode: InputMode;
  text: string;
  nodes: { id: string; text: string }[];
  edges: { from: string; to: string }[];
  attemptNumber: number;
  previousScore: number | null;
  unlockModelAnswer?: boolean;
}

export async function requestFeedback(req: FeedbackRequest): Promise<Feedback> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchTopics(): Promise<TopicsResponse> {
  const res = await fetch("/api/topics");
  if (!res.ok) throw new Error("Failed to load topics");
  return res.json();
}

export function nodesToPayload(nodes: MindNode[]) {
  return nodes
    .filter((n) => n.text.trim().length > 0)
    .map((n) => ({ id: n.id, text: n.text.trim() }));
}

export function edgesToPayload(edges: MindEdge[]) {
  return edges.map((e) => ({ from: e.from, to: e.to }));
}

export function nodesToText(nodes: MindNode[]) {
  return nodes
    .map((n) => n.text.trim())
    .filter(Boolean)
    .join(". ");
}

export function topicSlug(topic: string) {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
