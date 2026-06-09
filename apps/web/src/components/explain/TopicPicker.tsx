"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "Photosynthesis",
  "The Water Cycle",
  "Gravity",
  "The Human Heart",
];

export default function TopicPicker({ onStart }: { onStart: (topic: string) => void }) {
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
          <span className="brand-name">Explain with Haku</span>
        </div>
        <h1>
          What do you want to <span className="grad-text">understand</span>?
        </h1>
        <p className="topic-sub">
          Pick a topic. You explain it — mind map or text — and Haku checks your
          understanding with pinpoint feedback.
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
            <button key={s} type="button" className="chip" onClick={() => submit(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <footer className="topic-foot">
        Active recall in the workspace · coaching in the Haku sidebar
      </footer>
    </div>
  );
}
