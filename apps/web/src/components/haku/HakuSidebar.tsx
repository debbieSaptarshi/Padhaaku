"use client";

import type { Feedback } from "@/lib/core/types";

import { HakuFeedback } from "./HakuFeedback";

export function HakuSidebar({
  active,
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
  active: boolean;
  topic: string | null;
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
  if (!active) {
    return (
      <aside className="haku-sidebar haku-sidebar-idle">
        <div className="haku-idle">
          <span className="fp-buddy" aria-hidden>
            ✦
          </span>
          <p className="haku-name">Haku</p>
          <p className="haku-idle-text">
            Pick <strong>Explain</strong> and choose a topic. I&apos;ll coach you
            through active recall — or use <strong>Ask</strong> for a quick
            overview.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="haku-sidebar">
      <HakuFeedback
        topic={topic ?? "this topic"}
        feedback={feedback}
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        roundNumber={roundNumber}
        onCheck={onCheck}
        onHoverItem={onHoverItem}
        onRevise={onRevise}
        modelAnswerFull={modelAnswerFull}
      />
    </aside>
  );
}
