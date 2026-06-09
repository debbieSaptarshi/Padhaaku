const DEVICE_KEY = "padhaaku_device_id";
const SESSION_KEY = "padhaaku_explain_session";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `dev-${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function createSessionId(): string {
  return `sess-${crypto.randomUUID()}`;
}

export interface ExplainSessionMeta {
  sessionId: string;
  topic: string;
  roundNumber: number;
  lastScore: number | null;
}

export function loadExplainSession(): ExplainSessionMeta | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExplainSessionMeta;
  } catch {
    return null;
  }
}

export function saveExplainSession(meta: ExplainSessionMeta) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(meta));
}

export function clearExplainSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
