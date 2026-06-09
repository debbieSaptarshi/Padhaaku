import type { Stroke } from "./types";

const PAPER = "#faf8f5";
const INK = "#1a1a2e";
const RULE = "rgba(0,0,0,0.08)";

function drawRuledPaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  const lineGap = 32;
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  for (let y = lineGap; y < h; y += lineGap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(124, 92, 255, 0.15)";
  ctx.beginPath();
  ctx.moveTo(56, 0);
  ctx.lineTo(56, h);
  ctx.stroke();
}

function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  inkOverride?: string
) {
  for (const s of strokes) {
    if (s.points.length < 2) continue;
    ctx.strokeStyle = inkOverride || s.color || INK;
    ctx.lineWidth = s.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
  }
}

export function captureHandwritingImage(
  strokes: Stroke[],
  width: number,
  height: number
): string | null {
  if (!strokes.length || width < 10 || height < 10) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  drawRuledPaper(ctx, width, height);
  drawStrokes(ctx, strokes, INK);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function strokeStats(strokes: Stroke[]) {
  const pointCount = strokes.reduce((n, s) => n + s.points.length, 0);
  return { strokeCount: strokes.length, pointCount };
}
