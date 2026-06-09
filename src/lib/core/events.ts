import type { Feedback, StudyMode } from "./types";

export type PadhaakuEvent =
  | { type: "topic:selected"; topic: string; mode: StudyMode }
  | { type: "explain:draft_changed"; hasContent: boolean }
  | { type: "explain:checked"; feedback: Feedback }
  | { type: "handoff:requested"; to: StudyMode; reason: string };

type Listener = (event: PadhaakuEvent) => void;

const listeners = new Set<Listener>();

export function emitPadhaakuEvent(event: PadhaakuEvent) {
  listeners.forEach((listener) => listener(event));
}

export function subscribePadhaakuEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
