export function strokeMetrics(strokes) {
  if (!Array.isArray(strokes) || !strokes.length) {
    return { strokeCount: 0, pointCount: 0, substantial: false };
  }
  let pointCount = 0;
  for (const s of strokes) {
    pointCount += Array.isArray(s.points) ? s.points.length : 0;
  }
  return {
    strokeCount: strokes.length,
    pointCount,
    substantial: pointCount >= 40 && strokes.length >= 2,
  };
}

export function handwritingNudges({ strokes, caption, mode }) {
  if (mode !== "handwriting") return [];
  const metrics = strokeMetrics(strokes);
  const items = [];

  if (!metrics.substantial && !caption?.trim()) {
    items.push({
      kind: "missing",
      title: "Start writing or drawing",
      detail:
        "Use the pen to sketch your explanation — equations, labels, arrows, or bullet points.",
      nodeId: null,
      span: null,
    });
    return items;
  }

  if (metrics.substantial && !caption?.trim()) {
    items.push({
      kind: "incomplete",
      title: "Label your handwriting",
      detail:
        "You drew on the canvas — great! Add a short caption below naming the key ideas so I can check them precisely.",
      nodeId: null,
      span: null,
    });
  }

  if (metrics.substantial) {
    items.push({
      kind: "good",
      title: "Handwritten work captured",
      detail:
        "Nice — you're explaining with pen-and-paper thinking, not just typing shortcuts.",
      nodeId: null,
      span: null,
    });
  }

  return items;
}
