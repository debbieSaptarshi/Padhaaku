import type { SessionAttempt } from "../lib/types";

export default function MasteryScreen({
  topicLabel,
  score,
  attempts,
  onAnother,
  onExport,
}: {
  topicLabel: string;
  score: number;
  attempts: SessionAttempt[];
  onAnother: () => void;
  onExport: () => void;
}) {
  const first = attempts[0]?.score ?? score;
  const delta = score - first;

  return (
    <div className="mastery-overlay" role="dialog" aria-labelledby="mastery-title">
      <div className="mastery-card">
        <div className="mastery-icon" aria-hidden>
          ✦
        </div>
        <h2 id="mastery-title">You've got {topicLabel}!</h2>
        <p className="mastery-score">
          Score: <strong>{score}</strong>
          {attempts.length > 1 && (
            <span className="mastery-delta">
              {" "}
              ({delta >= 0 ? "+" : ""}
              {delta} from first try)
            </span>
          )}
        </p>
        <p className="mastery-sub">
          You explained it in your own words and closed the gaps. That's real understanding.
        </p>
        <div className="mastery-actions">
          <button type="button" className="mastery-primary" onClick={onAnother}>
            Pick another topic
          </button>
          <button type="button" className="mastery-secondary" onClick={onExport}>
            Export map
          </button>
        </div>
      </div>
    </div>
  );
}
