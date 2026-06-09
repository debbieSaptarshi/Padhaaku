const MODEL_UNLOCK_ATTEMPTS = 2;
const MODEL_UNLOCK_SCORE = 60;
const MODEL_UNLOCK_MS = 3 * 60 * 1000;
const MASTERY_THRESHOLD = 75;

export function validateFeedback(parsed, payload) {
  if (!parsed || typeof parsed !== "object") return null;

  const items = Array.isArray(parsed.items)
    ? parsed.items
        .filter((i) => i && i.title)
        .slice(0, 12)
        .map((i) => ({
          kind: ["good", "incomplete", "misconception", "missing"].includes(i.kind)
            ? i.kind
            : "incomplete",
          title: String(i.title).slice(0, 120),
          detail: String(i.detail || "").slice(0, 400),
          nodeId: i.nodeId ? String(i.nodeId) : null,
          span: i.span ? String(i.span).slice(0, 200) : null,
        }))
    : [];

  if (!items.length) {
    items.push({
      kind: "incomplete",
      title: "Keep explaining",
      detail: "Add more detail to your explanation so I can give better feedback.",
      nodeId: null,
      span: null,
    });
  }

  const followUp = String(parsed.followUp || "").trim();
  const modelAnswer = String(parsed.modelAnswer || "").trim().slice(0, 800);

  return {
    score: clampScore(parsed.score),
    summary: String(parsed.summary || "Thanks for explaining — here's my take.").slice(0, 400),
    items,
    followUp:
      followUp ||
      "What is the most important idea here, and why does it matter?",
    modelAnswer,
  };
}

export function applyResponsePolicy(result, meta) {
  const attemptNumber = Math.max(1, Number(meta.attemptNumber) || 1);
  const previousScore =
    meta.previousScore === null || meta.previousScore === undefined
      ? null
      : clampScore(meta.previousScore);
  const sessionStartedAt = Number(meta.sessionStartedAt) || Date.now();
  const elapsed = Date.now() - sessionStartedAt;

  const scoreDelta =
    previousScore === null ? null : result.score - previousScore;

  const canUnlockModel =
    attemptNumber >= MODEL_UNLOCK_ATTEMPTS ||
    result.score >= MODEL_UNLOCK_SCORE ||
    elapsed >= MODEL_UNLOCK_MS;

  let unlockHint = null;
  if (!canUnlockModel) {
    const remaining = Math.max(0, MODEL_UNLOCK_ATTEMPTS - attemptNumber);
    unlockHint =
      remaining > 0
        ? `Check again after refining your explanation (${remaining} more attempt${remaining === 1 ? "" : "s"} unlocks the model answer).`
        : "Keep improving your score to unlock the model answer.";
  }

  return {
    ...result,
    scoreDelta,
    modelAnswer: canUnlockModel ? result.modelAnswer : null,
    modelAnswerLocked: !canUnlockModel,
    unlockHint: canUnlockModel ? null : unlockHint,
    masteryReached: result.score >= MASTERY_THRESHOLD,
    attemptNumber,
  };
}

function clampScore(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}
