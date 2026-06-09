import { useCallback, useEffect, useRef } from "react";
import type { SessionSnapshot } from "../lib/types";
import { topicSlug } from "../lib/api";

const STORAGE_PREFIX = "padhaaku:session:";

export function sessionKey(topic: string) {
  return `${STORAGE_PREFIX}${topicSlug(topic)}`;
}

export function loadSession(topic: string): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(sessionKey(topic));
    if (!raw) return null;
    return JSON.parse(raw) as SessionSnapshot;
  } catch {
    return null;
  }
}

export function saveSession(snapshot: SessionSnapshot) {
  try {
    localStorage.setItem(sessionKey(snapshot.topic), JSON.stringify(snapshot));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function clearSession(topic: string) {
  localStorage.removeItem(sessionKey(topic));
}

export function useSessionPersistence(
  topic: string,
  snapshot: SessionSnapshot,
  enabled = true
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveSession(snapshot), 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [snapshot, enabled, topic]);
}

export function useRestoreBanner(topic: string) {
  return useCallback(() => loadSession(topic), [topic]);
}
