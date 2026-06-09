import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Stroke } from "../lib/types";

type Tool = "pen" | "eraser";

const PEN_COLORS = ["#1a1a2e", "#7c5cff", "#2563eb", "#059669", "#dc2626"];
const INK = PEN_COLORS[0];

let idSeed = 1;
const uid = () => `hw-${Date.now().toString(36)}-${idSeed++}`;

export interface HandwritingCanvasHandle {
  getSize: () => { width: number; height: number };
}

interface Props {
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  caption: string;
  onCaptionChange: (v: string) => void;
}

const HandwritingCanvas = forwardRef<HandwritingCanvasHandle, Props>(
  function HandwritingCanvas({ strokes, setStrokes, caption, onCaptionChange }, ref) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const interaction = useRef<{ id: string; tool: Tool } | null>(null);

    const [tool, setTool] = useState<Tool>("pen");
    const [penColor, setPenColor] = useState(INK);
    const [size, setSize] = useState({ width: 800, height: 480 });

    useImperativeHandle(ref, () => ({
      getSize: () => size,
    }));

    const localPoint = useCallback((e: { clientX: number; clientY: number }) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);

    const resize = useCallback(() => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;
      const w = wrap.clientWidth;
      const h = Math.max(360, Math.min(560, wrap.clientHeight - 8));
      canvas.width = w;
      canvas.height = h;
      setSize({ width: w, height: h });
    }, []);

    useEffect(() => {
      resize();
      const ro = new ResizeObserver(resize);
      if (wrapRef.current) ro.observe(wrapRef.current);
      return () => ro.disconnect();
    }, [resize]);

    const drawPaper = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = "#faf8f5";
      ctx.fillRect(0, 0, w, h);
      const gap = 32;
      ctx.strokeStyle = "rgba(0,0,0,0.07)";
      ctx.lineWidth = 1;
      for (let y = gap; y < h; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(124, 92, 255, 0.18)";
      ctx.beginPath();
      ctx.moveTo(56, 0);
      ctx.lineTo(56, h);
      ctx.stroke();
    }, []);

    const drawStrokes = useCallback(
      (ctx: CanvasRenderingContext2D, list: Stroke[]) => {
        for (const s of list) {
          if (s.points.length < 2) continue;
          ctx.strokeStyle = s.color;
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
      },
      []
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawPaper(ctx, canvas.width, canvas.height);
      drawStrokes(ctx, strokes);
    }, [strokes, size, drawPaper, drawStrokes]);

    const eraseAt = useCallback(
      (p: { x: number; y: number }) => {
        const R = 18;
        setStrokes((prev) =>
          prev.filter(
            (s) => !s.points.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) < R)
          )
        );
      },
      [setStrokes]
    );

    const onPointerDown = (e: ReactPointerEvent) => {
      e.preventDefault();
      const p = localPoint(e);
      if (tool === "eraser") {
        interaction.current = { id: "eraser", tool };
        eraseAt(p);
      } else {
        const id = uid();
        const pressure = e.pressure > 0 ? e.pressure : 0.5;
        setStrokes((prev) => [
          ...prev,
          { id, color: penColor, width: 1.5 + pressure * 4, points: [p] },
        ]);
        interaction.current = { id, tool };
      }
      canvasRef.current!.setPointerCapture(e.pointerId);
    };

    useEffect(() => {
      const move = (e: PointerEvent) => {
        const act = interaction.current;
        if (!act) return;
        const p = localPoint(e);
        if (act.tool === "eraser") {
          eraseAt(p);
        } else {
          const pressure = e.pressure > 0 ? e.pressure : 0.5;
          setStrokes((prev) =>
            prev.map((s) =>
              s.id === act.id
                ? {
                    ...s,
                    width: Math.max(s.width, 1.5 + pressure * 4),
                    points: [...s.points, p],
                  }
                : s
            )
          );
        }
      };
      const up = () => {
        interaction.current = null;
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
    }, [localPoint, setStrokes, eraseAt]);

    const undo = () => setStrokes((prev) => prev.slice(0, -1));
    const clear = () => setStrokes([]);

    return (
      <div className="handwriting-wrap">
        <div className="canvas-toolbar">
          <div className="tool-group">
            <button
              className={tool === "pen" ? "tool active" : "tool"}
              onClick={() => setTool("pen")}
              title="Pen — works with mouse, trackpad, or stylus"
            >
              ✍️ Pen
            </button>
            <button
              className={tool === "eraser" ? "tool active" : "tool"}
              onClick={() => setTool("eraser")}
              title="Eraser"
            >
              ⌫ Eraser
            </button>
          </div>
          {tool === "pen" && (
            <div className="tool-group swatches">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  className={"swatch" + (penColor === c ? " on" : "")}
                  style={{ background: c }}
                  onClick={() => setPenColor(c)}
                  aria-label={`Ink ${c}`}
                />
              ))}
            </div>
          )}
          <div className="tool-group">
            <button className="tool ghost" onClick={undo} disabled={!strokes.length}>
              ↩ Undo
            </button>
            <button className="tool ghost" onClick={clear} disabled={!strokes.length}>
              🗑 Clear
            </button>
          </div>
        </div>

        <div ref={wrapRef} className="handwriting-surface-wrap">
          <canvas
            ref={canvasRef}
            className={"handwriting-canvas tool-" + tool}
            onPointerDown={onPointerDown}
          />
          {strokes.length === 0 && !caption.trim() && (
            <div className="canvas-hint handwriting-hint">
              <p>Write like you're on paper.</p>
              <ul>
                <li>
                  Use a <b>stylus</b> or finger on a tablet, or your mouse here.
                </li>
                <li>Sketch diagrams, steps, labels — crossings-out are fine.</li>
                <li>
                  Add a short <b>caption</b> below to name the key ideas you wrote.
                </li>
              </ul>
            </div>
          )}
        </div>

        <label className="handwriting-caption">
          <span>Caption (name the ideas in your handwriting)</span>
          <textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="e.g. Light hits chlorophyll → CO₂ + water → glucose + oxygen"
            rows={2}
          />
        </label>
      </div>
    );
  }
);

export default HandwritingCanvas;
