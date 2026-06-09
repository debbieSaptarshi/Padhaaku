type FeedbackResult = {
  score: number;
  followUp: string;
  modelAnswer: string;
  [key: string]: unknown;
};

const EXPLAIN_POLICY = {
  minRoundsBeforeReveal: 3,
  unlockScoreThreshold: 80,
};

function modelAnswerUnlocked(roundNumber: number, score: number): boolean {
  return (
    roundNumber >= EXPLAIN_POLICY.minRoundsBeforeReveal ||
    score >= EXPLAIN_POLICY.unlockScoreThreshold
  );
}

export function enrichFeedback(
  result: FeedbackResult,
  options: { roundNumber?: number; previousScore?: number | null },
) {
  const roundNumber = options.roundNumber ?? 1;
  const previousScore = options.previousScore ?? null;
  const scoreDelta =
    previousScore === null ? undefined : result.score - previousScore;
  const unlocked = modelAnswerUnlocked(roundNumber, result.score);

  return {
    ...result,
    scoreDelta,
    roundNumber,
    modelAnswerUnlocked: unlocked,
    modelAnswer: unlocked ? result.modelAnswer : "",
  };
}

export function sanitizeFollowUp(followUp: string): string {
  if (!followUp) return followUp;
  const lower = followUp.toLowerCase();
  const banned = ["the answer is", "the correct answer", "it is defined as"];
  if (banned.some((phrase) => lower.includes(phrase))) {
    return "What part of your explanation are you least confident about? Try adding one more sentence.";
  }
  return followUp;
}
