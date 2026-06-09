"use client";

import { useMemo } from "react";
import type { Feedback, FeedbackKind } from "@/lib/canvas-types";

interface Segment {
  text: string;
  kind?: FeedbackKind;
  title?: string;
}

function buildSegments(text: string, feedback: Feedback | null): Segment[] {
  if (!feedback) return [{ text }];
  const marks: { start: number; end: number; kind: FeedbackKind; title: string }[] = [];
  const lower = text.toLowerCase();
  for (const item of feedback.items) {
    if (!item.span) continue;
    const idx = lower.indexOf(item.span.toLowerCase());
    if (idx === -1) continue;
    marks.push({
      start: idx,
      end: idx + item.span.length,
      kind: item.kind,
      title: item.title,
    });
  }
  marks.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const m of marks) {
    if (m.start < cursor) continue; // skip overlaps
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start) });
    segments.push({ text: text.slice(m.start, m.end), kind: m.kind, title: m.title });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

export default function TextEditor({
  value,
  onChange,
  feedback,
}: {
  value: string;
  onChange: (v: string) => void;
  feedback: Feedback | null;
}) {
  const segments = useMemo(() => buildSegments(value, feedback), [value, feedback]);
  const hasHighlights = segments.some((s) => s.kind);

  return (
    <div className="text-editor">
      <label className="te-label">Write what you think it is, in your own words</label>
      <textarea
        className="te-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing… don't worry about being perfect — that's the whole point. Your study buddy will help you fix it."
        autoFocus
      />

      {feedback && hasHighlights && (
        <div className="te-review">
          <div className="te-review-head">
            <span>Reviewed</span>
            <div className="te-legend">
              <i className="lg good" /> on track
              <i className="lg misconception" /> rethink this
            </div>
          </div>
          <p className="te-review-body">
            {segments.map((s, i) =>
              s.kind ? (
                <mark key={i} className={`hl ${s.kind}`} title={s.title}>
                  {s.text}
                </mark>
              ) : (
                <span key={i}>{s.text}</span>
              )
            )}
          </p>
        </div>
      )}
    </div>
  );
}
