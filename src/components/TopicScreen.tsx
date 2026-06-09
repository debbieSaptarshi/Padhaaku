import { useEffect, useState } from "react";
import { fetchTopics } from "../lib/api";
import type { TopicPack } from "../lib/types";

const FALLBACK_CHIPS = ["Photosynthesis", "Gravity", "The Water Cycle", "Democracy"];

export default function TopicScreen({ onStart }: { onStart: (topic: string) => void }) {
  const [value, setValue] = useState("");
  const [packs, setPacks] = useState<TopicPack[]>([]);

  useEffect(() => {
    fetchTopics()
      .then((data) => setPacks(data.packs))
      .catch(() => setPacks([]));
  }, []);

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
          Pick a topic. Explain it on a mind map — your study buddy flags what's wrong,
          nudges what's missing, and tracks your mastery as you revise.
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

        {packs.length > 0 ? (
          <div className="topic-packs">
            {packs.map((pack) => (
              <div key={pack.id} className="topic-pack">
                <span className="pack-label">{pack.label}</span>
                <div className="suggestions">
                  {pack.topics.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className="chip"
                      onClick={() => submit(t.label)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="suggestions">
            <span className="suggestions-label">Try one:</span>
            {FALLBACK_CHIPS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => submit(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <footer className="topic-foot">
        Active recall + spatial feedback. That's how understanding sticks.
      </footer>
    </div>
  );
}
