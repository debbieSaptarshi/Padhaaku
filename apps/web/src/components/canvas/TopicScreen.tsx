"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "Photosynthesis",
  "The Water Cycle",
  "Gravity",
  "The Human Heart",
];

export default function TopicScreen({ onStart }: { onStart: (topic: string) => void }) {
  const [value, setValue] = useState("");

  const submit = (t: string) => {
    const clean = t.trim();
    if (clean) onStart(clean);
  };

  return (
    <div className="topic-screen">
      <div className="topic-aurora" aria-hidden />
      <div className="topic-card">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            ✦
          </span>
          <span className="brand-name">Padhaaku</span>
        </div>
        <h1>
          What do you want to <span className="grad-text">understand</span>?
        </h1>
        <p className="topic-sub">
          Pick a topic. We won't lecture you — instead you'll explain it in your own
          words on a canvas, and your study buddy will nudge you toward a clearer
          understanding.
        </p>

        <form
          className="topic-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit(value);
          }}
        >
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Photosynthesis"
            aria-label="Topic to understand"
          />
          <button type="submit" disabled={!value.trim()}>
            Start →
          </button>
        </form>

        <div className="suggestions">
          <span className="suggestions-label">Try one:</span>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => submit(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <footer className="topic-foot">
        Active recall + a friendly nudge. That's how understanding sticks.
      </footer>
    </div>
  );
}
