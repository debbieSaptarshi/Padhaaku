import type { PedagogyPolicy, StudyMode } from "./types";

const POLICIES: Record<StudyMode, PedagogyPolicy> = {
  ask: {
    allowModelAnswer: true,
    allowDirectAnswer: true,
    minRoundsBeforeReveal: 0,
    unlockScoreThreshold: 0,
  },
  explain: {
    allowModelAnswer: false,
    allowDirectAnswer: false,
    minRoundsBeforeReveal: 3,
    unlockScoreThreshold: 80,
  },
  practice: {
    allowModelAnswer: false,
    allowDirectAnswer: false,
    minRoundsBeforeReveal: 2,
    unlockScoreThreshold: 70,
  },
};

export function getPedagogyPolicy(mode: StudyMode): PedagogyPolicy {
  return POLICIES[mode];
}

export function isModelAnswerUnlocked(
  policy: PedagogyPolicy,
  roundNumber: number,
  score: number,
): boolean {
  if (policy.allowModelAnswer) return true;
  return (
    roundNumber >= policy.minRoundsBeforeReveal ||
    score >= policy.unlockScoreThreshold
  );
}
