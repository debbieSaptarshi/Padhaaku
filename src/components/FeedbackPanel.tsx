import { useState } from "react";
import type { Feedback, FeedbackKind, SessionAttempt } from "../lib/types";

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
  attempts,
  onCheck,
  onStuck,
  onHoverItem,
  onStartFresh,
}: {
  topic: string;
  feedback: Feedback | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  attempts: SessionAttempt[];
  onCheck: () => void;
  onStuck: () => void;
  onHoverItem: (id: string | null) => void;
  onStartFresh: () => void;
}) {
  const [showModel, setShowModel] = useState(false);

  const scoreDelta =
    feedback?.previousScore != null ? feedback.score - feedback.previousScore : null;

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
        {feedback && feedback.attemptNumber >= 1 && !feedback.modelAnswer && (
          <button type="button" className="stuck-btn" onClick={onStuck} disabled={loading}>
            I'm stuck — show me a strong explanation
          </button>
        )}
        {isEmpty && !feedback && (
          <p className="fp-hint">Add your explanation, then ask your buddy to check it.</p>
        )}
      </div>

      {error && <div className="fp-error">{error}</div>}

      {!feedback && !loading && !error && (
        <div className="fp-welcome">
          <div className="fp-buddy">✦</div>
          <h3>I'm your study buddy</h3>
          <p>
            Explain <b>{topic}</b> however you like — sketch a mind map or just type.
            When you're ready, I'll tell you what you nailed, gently flag anything that's
            off, and nudge you toward the bits you're missing.
          </p>
        </div>
      )}

      {feedback && (
        <div className="fp-result">
          <div className="fp-score-row">
            <ScoreRing value={feedback.score} delta={scoreDelta} />
            <div className="fp-summary">
              <span className="fp-topic">{feedback.topicLabel}</span>
              <p>{feedback.summary}</p>
              {attempts.length > 1 && (
                <AttemptSparkline attempts={attempts} />
              )}
            </div>
          </div>

          {feedback.mastery.achieved && (
            <div className="fp-mastery-badge">🎉 Mastery reached!</div>
          )}

          <ul className="fp-items">
            {feedback.items.slice(0, 6).map((item, i) => {
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
            {feedback.items.length > 6 && (
              <li className="fp-more">+{feedback.items.length - 6} more notes</li>
            )}
          </ul>

          {feedback.followUp && (
            <div className="fp-followup">
              <span className="fp-followup-label">Think about this 🤔</span>
              <p>{feedback.followUp}</p>
            </div>
          )}

          {feedback.modelAnswer ? (
            <>
              <button className="fp-model-toggle" onClick={() => setShowModel((s) => !s)}>
                {showModel ? "Hide" : "Show"} a strong explanation
              </button>
              {showModel && <div className="fp-model">{feedback.modelAnswer}</div>}
            </>
          ) : feedback.attemptNumber < 2 ? (
            <p className="fp-withhold">Revise once more before I show a full explanation — you've got this.</p>
          ) : null}

          <button type="button" className="fp-fresh-link" onClick={onStartFresh}>
            Start fresh on this topic
          </button>

          <div className="fp-provider">
            {feedback.provider === "local"
              ? "Built-in study buddy · 20 topics · add an API key for any topic"
              : `Powered by ${feedback.provider}`}
          </div>
        </div>
      )}
    </aside>
  );
}

function ScoreRing({
  value,
  delta,
}: {
  value: number;
  delta: number | null;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color =
    value >= 75 ? "#34d399" : value >= 45 ? "#fbbf24" : "#fb7185";
  return (
    <div className="score-ring-wrap">
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
      {delta != null && delta !== 0 && (
        <span className={`score-delta ${delta > 0 ? "up" : "down"}`}>
          {delta > 0 ? "+" : ""}
          {delta}
        </span>
      )}
    </div>
  );
}

function AttemptSparkline({ attempts }: { attempts: SessionAttempt[] }) {
  const recent = attempts.slice(-6);
  const max = Math.max(...recent.map((a) => a.score), 1);
  return (
    <div className="attempt-sparkline" title="Recent check scores">
      {recent.map((a, i) => (
        <div
          key={i}
          className="spark-bar"
          style={{ height: `${Math.max(8, (a.score / max) * 36)}px` }}
        />
      ))}
    </div>
  );
}
