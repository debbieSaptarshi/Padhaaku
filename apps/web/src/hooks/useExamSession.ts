import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchPracticeSet, checkAnswer } from "../lib/practiceApi";
import type {
  ExamSession,
  PracticeQuestion,
  QuestionAttemptState,
  PracticeCheckResponse,
} from "../lib/examTypes";

const STORAGE_PREFIX = "padhaaku:exam:";

function loadSession(setId: string): ExamSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + setId);
    return raw ? (JSON.parse(raw) as ExamSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: ExamSession) {
  try {
    localStorage.setItem(STORAGE_PREFIX + session.setId, JSON.stringify(session));
  } catch { /* quota exceeded — ignore */ }
}

export function useExamSession(setId = "default") {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<PracticeCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPracticeSet(setId);
        if (cancelled) return;
        setQuestions(data.questions);

        const saved = loadSession(setId);
        if (saved && saved.questionIds.length === data.questions.length) {
          setSession(saved);
        } else {
          const ids = data.questions.map((q) => q.id);
          const states: Record<string, QuestionAttemptState> = {};
          for (const q of data.questions) {
            states[q.id] = { questionId: q.id, status: "unseen" };
          }
          setSession({
            setId,
            questionIds: ids,
            currentIndex: 0,
            startedAt: Date.now(),
            questionStates: states,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [setId]);

  useEffect(() => {
    if (!session) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveSession(session), 400);
    return () => clearTimeout(saveTimer.current);
  }, [session]);

  const currentIndex = session?.currentIndex ?? 0;
  const total = questions.length;
  const currentQuestion = questions[currentIndex] ?? null;
  const currentState = session && currentQuestion
    ? session.questionStates[currentQuestion.id] ?? null
    : null;

  const updateState = useCallback(
    (questionId: string, patch: Partial<QuestionAttemptState>) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questionStates: {
            ...prev.questionStates,
            [questionId]: { ...prev.questionStates[questionId], ...patch },
          },
        };
      });
    },
    [],
  );

  const goTo = useCallback(
    (index: number) => {
      setSession((prev) => {
        if (!prev) return prev;
        const clamped = Math.max(0, Math.min(prev.questionIds.length - 1, index));
        return { ...prev, currentIndex: clamped };
      });
      setCheckResult(null);
    },
    [],
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  const selectChoice = useCallback(
    (choiceId: string) => {
      if (!currentQuestion) return;
      updateState(currentQuestion.id, {
        selectedChoiceId: choiceId,
        status: "in_progress",
      });
      setCheckResult(null);
    },
    [currentQuestion, updateState],
  );

  const markDone = useCallback(
    (done: boolean) => {
      if (!currentQuestion) return;
      updateState(currentQuestion.id, {
        status: done ? "done" : "in_progress",
      });
    },
    [currentQuestion, updateState],
  );

  const checkCurrentAnswer = useCallback(async () => {
    if (!currentQuestion || !currentState) return null;
    setChecking(true);
    setCheckResult(null);
    try {
      const isMC = currentQuestion.type === "multiple_choice";
      const result = await checkAnswer({
        questionId: currentQuestion.id,
        conceptId: currentQuestion.conceptId,
        responseType: currentQuestion.type,
        selectedChoiceId: isMC ? currentState.selectedChoiceId : undefined,
        response: !isMC ? currentState.openEndedDraft : undefined,
      });
      updateState(currentQuestion.id, {
        score: result.score,
        correct: result.correct,
        checkedAt: Date.now(),
      });
      setCheckResult(result);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check failed");
      return null;
    } finally {
      setChecking(false);
    }
  }, [currentQuestion, currentState, updateState]);

  const elapsed = useMemo(() => {
    if (!session) return 0;
    return Math.floor((Date.now() - session.startedAt) / 1000);
  }, [session]);

  return {
    questions,
    session,
    loading,
    checking,
    checkResult,
    error,
    currentIndex,
    total,
    currentQuestion,
    currentState,
    elapsed,
    goTo,
    goNext,
    goPrev,
    selectChoice,
    markDone,
    checkCurrentAnswer,
  };
}
