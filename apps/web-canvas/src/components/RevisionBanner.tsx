import type { Feedback, SuggestedNode } from "../lib/types";

export default function RevisionBanner({
  feedback,
  onAddSuggested,
}: {
  feedback: Feedback;
  onAddSuggested: (s: SuggestedNode) => void;
}) {
  if (feedback.mastery?.achieved || feedback.masteryReached) return null;

  const suggested = feedback.suggestedNodes ?? [];
  const gaps = feedback.items.filter(
    (i) => i.kind === "missing" || i.kind === "misconception" || i.kind === "incomplete",
  );
  if (!gaps.length && !suggested.length) return null;

  const labels = suggested.map((s) => s.label).slice(0, 3);

  return (
    <div className="revision-banner" role="status">
      <div className="revision-banner-text">
        {labels.length > 0 ? (
          <>
            <strong>Next up:</strong> add{" "}
            {labels.map((l, i) => (
              <span key={l}>
                {i > 0 && (i === labels.length - 1 ? " and " : ", ")}
                <em>{l}</em>
              </span>
            ))}
            , then check again.
          </>
        ) : (
          <>
            <strong>Revise</strong> the flagged items below, then check again.
          </>
        )}
      </div>
      {suggested.length > 0 && (
        <div className="revision-actions">
          {suggested.slice(0, 3).map((s) => (
            <button
              key={s.label}
              type="button"
              className="revision-add-btn"
              onClick={() => onAddSuggested(s)}
              title={s.hint}
            >
              + {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
