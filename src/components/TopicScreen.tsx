import { useState } from "react";

const SUGGESTIONS = [
  "Photosynthesis",
  "Newton's Laws",
  "Democracy",
  "The Water Cycle",
  "Gravity",
  "Fractions",
  "Climate Change",
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
          Pick a topic. You explain it — by <b>handwriting</b> on ruled paper, sketching a
          mind map, or typing — and your study buddy diagnoses your thinking without
          handing you the answer.
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
        Handwriting-first active recall · productive struggle · no answer dumps.
      </footer>
    </div>
  );
}
