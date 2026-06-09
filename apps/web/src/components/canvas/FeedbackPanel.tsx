"use client";

import { useState } from "react";
import type { Feedback, FeedbackKind } from "@/lib/canvas-types";

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
  onCheck,
  onHoverItem,
}: {
  topic: string;
  feedback: Feedback | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  onCheck: () => void;
  onHoverItem: (id: string | null) => void;
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
            <ScoreRing value={feedback.score} />
            <div className="fp-summary">
              <span className="fp-topic">{feedback.topicLabel}</span>
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

          <button className="fp-model-toggle" onClick={() => setShowModel((s) => !s)}>
            {showModel ? "Hide" : "Show"} a strong explanation
          </button>
          {showModel && <div className="fp-model">{feedback.modelAnswer}</div>}

          <div className="fp-provider">
            {feedback.provider === "local"
              ? "Heuristic study buddy · add an OpenAI/Anthropic key for full AI feedback"
              : `Powered by ${feedback.provider}`}
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
  const color =
    value >= 75 ? "#34d399" : value >= 45 ? "#fbbf24" : "#fb7185";
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
