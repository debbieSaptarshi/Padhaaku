import type {
  PracticeSetResponse,
  PracticeCheckRequest,
  PracticeCheckResponse,
} from "./examTypes";

export async function fetchPracticeSet(
  setId = "default",
): Promise<PracticeSetResponse> {
  const res = await fetch(`/api/v1/practice/set?setId=${setId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to load practice set (${res.status})`);
  }
  return res.json();
}

export async function checkAnswer(
  req: PracticeCheckRequest,
): Promise<PracticeCheckResponse> {
  const res = await fetch("/api/v1/practice/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Check failed (${res.status})`);
  }
  return res.json();
}
