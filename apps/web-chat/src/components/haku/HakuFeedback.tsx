"use client";

import { useState } from "react";

import type { Feedback, FeedbackKind } from "@/lib/core/types";

import { HakuScoreRing } from "./HakuScoreRing";

const KIND_META: Record<FeedbackKind, { icon: string; label: string }> = {
  good: { icon: "✓", label: "On track" },
  incomplete: { icon: "~", label: "Go deeper" },
  missing: { icon: "+", label: "Missing piece" },
  misconception: { icon: "✕", label: "Rethink this" },
};

export function HakuFeedback({
  topic,
  feedback,
  loading,
  error,
  isEmpty,
  roundNumber,
  onCheck,
  onHoverItem,
  onRevise,
  modelAnswerFull,
}: {
  topic: string;
  feedback: Feedback | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  roundNumber: number;
  onCheck: () => void;
  onHoverItem: (id: string | null) => void;
  onRevise: () => void;
  modelAnswerFull?: string;
}) {
  const [showModel, setShowModel] = useState(false);
  const canReveal = feedback?.modelAnswerUnlocked ?? false;
  const modelText = modelAnswerFull || feedback?.modelAnswer || "";

  return (
    <aside className="feedback-panel haku-sidebar-inner">
      <div className="haku-brand">
        <span className="fp-buddy" aria-hidden>
          ✦
        </span>
        <div>
          <p className="haku-name">Haku</p>
          <p className="haku-tagline">your study buddy</p>
        </div>
        {roundNumber > 0 && <span className="haku-round">Round {roundNumber}</span>}
      </div>

      <div className="fp-cta">
        <button className="check-btn" onClick={onCheck} disabled={loading || isEmpty}>
          {loading ? (
            <span className="spinner" aria-hidden />
          ) : feedback ? (
            "↻ Check again"
          ) : (
            "Check my understanding"
          )}
        </button>
        {isEmpty && !feedback && (
          <p className="fp-hint">Add your explanation, then ask Haku to check it.</p>
        )}
      </div>

      {error && <div className="fp-error">{error}</div>}

      {!feedback && !loading && !error && (
        <div className="fp-welcome">
          <h3>Explain it yourself</h3>
          <p>
            Sketch or type what you think <b>{topic}</b> is. I&apos;ll highlight
            what&apos;s right, flag misconceptions, and nudge you — never just hand you the
            answer.
          </p>
        </div>
      )}

      {feedback && (
        <div className="fp-result">
          <div className="fp-score-row">
            <HakuScoreRing value={feedback.score} delta={feedback.scoreDelta} />
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

          <button type="button" className="check-btn revise-btn" onClick={onRevise}>
            Revise & try again
          </button>

          <button
            type="button"
            className="fp-model-toggle"
            disabled={!canReveal}
            onClick={() => canReveal && setShowModel((s) => !s)}
            title={
              canReveal
                ? undefined
                : `Keep going — unlock after round 3 or score 80+ (now ${feedback.score})`
            }
          >
            {canReveal
              ? showModel
                ? "Hide strong explanation"
                : "Show a strong explanation"
              : `Strong explanation locked (${feedback.score}/80)`}
          </button>
          {showModel && canReveal && modelText && (
            <div className="fp-model">{modelText}</div>
          )}

          <div className="fp-provider">
            {feedback.provider === "local"
              ? "Local study buddy · add OPENAI_API_KEY for any topic"
              : `Powered by ${feedback.provider}`}
          </div>
        </div>
      )}
    </aside>
  );
}
