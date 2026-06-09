import type { SessionDraft } from "./types";

const PREFIX = "padhaaku:session:";

function slug(topic: string) {
  return topic.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 120);
}

export function loadSession(topic: string): SessionDraft | null {
  try {
    const raw = localStorage.getItem(PREFIX + slug(topic));
    if (!raw) return null;
    return JSON.parse(raw) as SessionDraft;
  } catch {
    return null;
  }
}

export function saveSession(draft: SessionDraft) {
  try {
    localStorage.setItem(
      PREFIX + slug(draft.topic),
      JSON.stringify({ ...draft, updatedAt: Date.now() }),
    );
  } catch {
    // Storage full or private mode — ignore.
  }
}

export function clearSession(topic: string) {
  try {
    localStorage.removeItem(PREFIX + slug(topic));
  } catch {
    // ignore
  }
}

export function createSession(topic: string): SessionDraft {
  const now = Date.now();
  return {
    topic,
    mode: "handwriting",
    nodes: [],
    edges: [],
    strokes: [],
    text: "",
    handwritingStrokes: [],
    handwritingCaption: "",
    attempts: [],
    sessionStartedAt: now,
    updatedAt: now,
  };
}
