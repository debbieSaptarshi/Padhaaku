import type { Feedback, InputMode, MindNode } from "./types";

export interface FeedbackRequest {
  topic: string;
  mode: InputMode;
  text: string;
  nodes: { id: string; text: string }[];
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

export function nodesToPayload(nodes: MindNode[]) {
  return nodes
    .filter((n) => n.text.trim().length > 0)
    .map((n) => ({ id: n.id, text: n.text.trim() }));
}

export function nodesToText(nodes: MindNode[]) {
  return nodes
    .map((n) => n.text.trim())
    .filter(Boolean)
    .join(". ");
}
