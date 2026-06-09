import { useState } from "react";
import type { Feedback, FeedbackKind } from "../lib/types";

const KIND_META: Record<FeedbackKind, { icon: string; label: string }> = {
  good: { icon: "✓", label: "On track" },
  incomplete: { icon: "~", label: "Go deeper" },
  missing: { icon: "+", label: "Missing piece" },
  misconception: { icon: "✕", label: "Rethink this" },
};

export default function FeedbackPanel({
  topic,
  feedback,
  loading,
  error,
  isEmpty,
  refineNudge,
  onCheck,
  onHoverItem,
  masterySlot,
}: {
  topic: string;
  feedback: Feedback | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  refineNudge?: string | null;
  onCheck: () => void;
  onHoverItem: (id: string | null) => void;
  masterySlot?: React.ReactNode;
}) {
  const [showModel, setShowModel] = useState(false);

  return (
    <aside className="feedback-panel">
      <div className="fp-cta">
        <button
          className="check-btn"
          onClick={onCheck}
          disabled={loading || isEmpty}
        >
          {loading ? (
            <span className="spinner" aria-hidden />
          ) : feedback ? (
            "↻ Check again"
          ) : (
            "Check my understanding"
          )}
        </button>
        {isEmpty && !feedback && (
          <p className="fp-hint">
            Explain the topic — write by hand, sketch a mind map, or type — then check.
          </p>
        )}
        {refineNudge && !loading && (
          <p className="fp-hint fp-refine">{refineNudge}</p>
        )}
      </div>

      {error && <div className="fp-error">{error}</div>}

      {!feedback && !loading && !error && (
        <div className="fp-welcome">
          <div className="fp-buddy">✦</div>
          <h3>I&apos;m your study buddy</h3>
          <p>
            Explain <b>{topic}</b> in your own words — handwriting on ruled paper,
            a mind map, or typed prose. I won&apos;t hand you the answer; I&apos;ll show what you
            nailed, flag what&apos;s off, and nudge you forward.
          </p>
        </div>
      )}

      {feedback && (
        <div className="fp-result">
          {masterySlot}

          <div className="fp-score-row">
            <ScoreRing value={feedback.score} />
            <div className="fp-summary">
              <span className="fp-topic">{feedback.topicLabel}</span>
              {feedback.scoreDelta != null && feedback.scoreDelta !== 0 && (
                <span
                  className={"fp-delta " + (feedback.scoreDelta > 0 ? "up" : "down")}
                >
                  {feedback.scoreDelta > 0 ? "+" : ""}
                  {feedback.scoreDelta} since last try
                </span>
              )}
              <p>{feedback.summary}</p>
            </div>
          </div>

          <ul className="fp-items">
            {feedback.items.map((item, i) => {
              const meta = KIND_META[item.kind];
              return (
                <li
                  key={i}
                  className={`fp-item ${item.kind}`}
                  onMouseEnter={() => onHoverItem(item.nodeId)}
                  onMouseLeave={() => onHoverItem(null)}
                >
                  <span className={`fp-icon ${item.kind}`}>{meta.icon}</span>
                  <div>
                    <div className="fp-item-head">
                      <strong>{item.title}</strong>
                      <span className={`fp-tag ${item.kind}`}>{meta.label}</span>
                    </div>
                    <p>{item.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {feedback.followUp && (
            <div className="fp-followup">
              <span className="fp-followup-label">Think about this 🤔</span>
              <p>{feedback.followUp}</p>
            </div>
          )}

          {feedback.modelAnswerLocked ? (
            <div className="fp-locked">
              <span className="fp-lock-icon" aria-hidden>
                🔒
              </span>
              <p>{feedback.unlockHint}</p>
            </div>
          ) : (
            <>
              <button
                className="fp-model-toggle"
                onClick={() => setShowModel((s) => !s)}
              >
                {showModel ? "Hide" : "Show"} a strong explanation
              </button>
              {showModel && feedback.modelAnswer && (
                <div className="fp-model">{feedback.modelAnswer}</div>
              )}
            </>
          )}

          <div className="fp-provider">
            {feedback.provider === "local"
              ? "Heuristic study buddy · add an OpenAI/Anthropic key for full AI + handwriting vision"
              : `Powered by ${feedback.provider}`}
            {(feedback.attemptNumber ?? 0) > 1 && (
              <> · Attempt {feedback.attemptNumber}</>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 75 ? "#34d399" : value >= 45 ? "#fbbf24" : "#fb7185";
  return (
    <div className="score-ring" title={`Understanding score: ${value}/100`}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} className="ring-bg" />
        <circle
          cx="32"
          cy="32"
          r={r}
          className="ring-fg"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="ring-label" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
