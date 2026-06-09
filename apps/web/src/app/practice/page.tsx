"use client";

import { useCallback, useEffect, useState } from "react";

import { AppNav } from "@/components/AppNav";
import type { PracticeQuestion } from "@padhaaku/core";

type MasteryMap = Record<string, number>;

const initialMastery: MasteryMap = {
  "projectile-motion": 4.7,
  "energy-conservation": 6.1,
  "quadratic-roots": 5.4,
  stoichiometry: 3.8,
};

export default function PracticePage() {
  const [mastery, setMastery] = useState<MasteryMap>(initialMastery);
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [response, setResponse] = useState("");
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    setScore(null);
    setResponse("");
    setHintsRevealed(0);
    try {
      const res = await fetch("/api/practice/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mastery }),
      });
      if (!res.ok) throw new Error("No questions available");
      const data = (await res.json()) as { question: PracticeQuestion };
      setQuestion(data.question);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Failed to load question");
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }, [mastery]);

  useEffect(() => {
    void loadQuestion();
  }, [loadQuestion]);

  async function submitAttempt() {
    if (!question || !response.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/practice/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: question.conceptId,
          questionId: question.id,
          response,
          hintCount: hintsRevealed,
          mastery,
        }),
      });
      const data = (await res.json()) as {
        score: number;
        masteryDelta: number;
      };
      setScore(data.score);
      setMastery((prev) => ({
        ...prev,
        [question.conceptId]: Math.min(
          10,
          (prev[question.conceptId] ?? 5) + (data.masteryDelta ?? 0),
        ),
      }));
      setFeedback(question.explanation);
    } catch {
      setFeedback("Could not score attempt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8">
      <AppNav />
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-ink">STEM Practice</h1>
        <p className="mt-2 text-slate-600">
          Hybrid RAG picks questions for your weakest concepts. Hints are revealed step by step.
        </p>
      </header>

      {question ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {question.subject} · difficulty {question.difficulty}
          </p>
          <p className="mt-3 text-lg text-ink">{question.prompt}</p>

          {hintsRevealed > 0 && (
            <div className="mt-4 space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              {question.hints.slice(0, hintsRevealed).map((hint, i) => (
                <p key={i}>
                  <strong>Hint {i + 1}:</strong> {hint}
                </p>
              ))}
            </div>
          )}

          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Explain your reasoning..."
            className="mt-4 w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none ring-accent focus:ring-2"
            rows={4}
            disabled={loading || score !== null}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {hintsRevealed < question.hints.length && score === null && (
              <button
                type="button"
                onClick={() => setHintsRevealed((h) => h + 1)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                disabled={loading}
              >
                Reveal hint
              </button>
            )}
            {score === null ? (
              <button
                type="button"
                onClick={() => void submitAttempt()}
                disabled={loading || !response.trim()}
                className="rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-white disabled:bg-slate-300"
              >
                Submit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void loadQuestion()}
                className="rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-white"
              >
                Next question
              </button>
            )}
          </div>

          {score !== null && (
            <p className="mt-4 text-sm font-medium text-slate-700">Score: {score}/10</p>
          )}
          {feedback && (
            <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{feedback}</p>
          )}
        </section>
      ) : (
        <p className="text-slate-500">{loading ? "Loading..." : feedback ?? "No question loaded."}</p>
      )}
    </main>
  );
}
