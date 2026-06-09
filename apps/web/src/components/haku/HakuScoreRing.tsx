export function HakuScoreRing({
  value,
  delta,
}: {
  value: number;
  delta?: number;
}) {
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
      {delta !== undefined && delta !== 0 && (
        <span
          className="absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
          style={{
            background: delta > 0 ? "rgba(52,211,153,0.2)" : "rgba(251,113,133,0.2)",
            color: delta > 0 ? "#34d399" : "#fb7185",
          }}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  );
}
