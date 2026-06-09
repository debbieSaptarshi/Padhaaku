const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

export async function fetchPracticeQuestion(mastery: Record<string, number>) {
  const response = await fetch(`${API_URL}/api/v1/practice/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mastery }),
  });
  if (!response.ok) throw new Error("Failed to fetch practice question");
  return response.json() as Promise<{ question: PracticeQuestionApi | null }>;
}

export async function checkPracticeAnswer(params: {
  conceptId: string;
  questionId: string;
  response: string;
  mastery: Record<string, number>;
}) {
  const response = await fetch(`${API_URL}/api/v1/practice/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error("Failed to check answer");
  return response.json() as Promise<{
    score: number;
    masteryDelta: number;
  }>;
}

export async function fetchHint(params: {
  conceptId: string;
  hintIndex: number;
  mastery: Record<string, number>;
}) {
  const response = await fetch(`${API_URL}/api/v1/practice/hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error("Failed to fetch hint");
  return response.json() as Promise<{ hint: string }>;
}

export type PracticeQuestionApi = {
  id: string;
  conceptId: string;
  subject: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  hints: string[];
  explanation: string;
};
