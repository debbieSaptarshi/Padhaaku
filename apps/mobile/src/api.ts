const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type PracticeQuestion = {
  id: string;
  conceptId: string;
  subject: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  hints: string[];
  explanation: string;
};

export async function fetchNextQuestion(mastery: Record<string, number>) {
  const res = await fetch(`${API_BASE}/api/practice/next`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mastery }),
  });
  if (!res.ok) throw new Error("Failed to load practice question");
  const data = (await res.json()) as { question: PracticeQuestion };
  return data.question;
}

export async function submitAttempt(params: {
  conceptId: string;
  questionId: string;
  response: string;
  hintCount: number;
  mastery: Record<string, number>;
}) {
  const res = await fetch(`${API_BASE}/api/practice/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: params.conceptId,
      questionId: params.questionId,
      response: params.response,
      hintCount: params.hintCount,
      mastery: params.mastery,
    }),
  });
  if (!res.ok) throw new Error("Failed to submit attempt");
  return res.json() as Promise<{
    score: number;
    masteryDelta: number;
    explanation?: string;
  }>;
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) return { ok: false };
  return res.json() as Promise<{ ok: boolean; llm: boolean; agents: string[] }>;
}
