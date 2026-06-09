import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { FeedbackKind, MindEdge, MindNode, Stroke, SuggestedNode } from "../lib/types";

type Tool = "select" | "pen" | "eraser";

const NODE_COLORS = ["#7c5cff", "#22d3ee", "#34d399", "#fbbf24", "#fb7185", "#f472b6"];
const PEN_COLORS = ["#e9e9f3", "#7c5cff", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];

let idSeed = 1;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${idSeed++}`;

interface Props {
  nodes: MindNode[];
  edges: MindEdge[];
  strokes: Stroke[];
  setNodes: React.Dispatch<React.SetStateAction<MindNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<MindEdge[]>>;
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  nodeStatus: Record<string, FeedbackKind>;
  focusedNodeId: string | null;
  ghostSuggestions?: SuggestedNode[];
  onAcceptGhost?: (s: SuggestedNode, x: number, y: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onClear?: () => void;
}

interface DragState {
  type: "drag-node" | "draw" | "connect";
  id: string;
  offsetX?: number;
  offsetY?: number;
}

export default function MindMapCanvas({
  nodes,
  edges,
  strokes,
  setNodes,
  setEdges,
  setStrokes,
  nodeStatus,
  focusedNodeId,
  ghostSuggestions = [],
  onAcceptGhost,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onClear,
}: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<DragState | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [penColor, setPenColor] = useState(PEN_COLORS[1]);
  const [tempEdge, setTempEdge] = useState<{ from: string; x: number; y: number } | null>(
    null
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const colorCursor = useRef(0);

  const localPoint = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = surfaceRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const addNode = useCallback(
    (x: number, y: number) => {
      const id = uid("n");
      const color = NODE_COLORS[colorCursor.current++ % NODE_COLORS.length];
      setNodes((prev) => [...prev, { id, x, y, text: "", color }]);
      setEditingId(id);
      return id;
    },
    [setNodes]
  );

  // ----- Surface (background) interactions -----
  const onSurfacePointerDown = (e: ReactPointerEvent) => {
    if (e.target !== surfaceRef.current) return; // only background
    const p = localPoint(e);
    if (tool === "pen") {
      const id = uid("s");
      const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
      setStrokes((prev) => [
        ...prev,
        { id, color: penColor, width: 1 + pressure * 5, points: [p] },
      ]);
      interaction.current = { type: "draw", id };
      surfaceRef.current!.setPointerCapture(e.pointerId);
    } else if (tool === "eraser") {
      interaction.current = { type: "draw", id: "eraser" };
      eraseAt(p);
      surfaceRef.current!.setPointerCapture(e.pointerId);
    } else {
      setEditingId(null);
    }
  };

  const eraseAt = useCallback(
    (p: { x: number; y: number }) => {
      const R = 16;
      setStrokes((prev) =>
        prev.filter(
          (s) =>
            !s.points.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) < R)
        )
      );
    },
    [setStrokes]
  );

  // ----- Global move/up while interacting -----
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const act = interaction.current;
      if (!act) return;
      const p = localPoint(e);
      if (act.type === "drag-node") {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === act.id
              ? { ...n, x: p.x - (act.offsetX || 0), y: p.y - (act.offsetY || 0) }
              : n
          )
        );
      } else if (act.type === "draw") {
        if (act.id === "eraser") {
          eraseAt(p);
        } else {
          const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
          setStrokes((prev) =>
            prev.map((s) =>
              s.id === act.id
                ? {
                    ...s,
                    width: Math.max(s.width, 1 + pressure * 5),
                    points: [...s.points, p],
                  }
                : s
            )
          );
        }
      } else if (act.type === "connect") {
        setTempEdge({ from: act.id, x: p.x, y: p.y });
      }
    };
    const up = (e: PointerEvent) => {
      const act = interaction.current;
      if (act?.type === "connect") {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const nodeEl = el?.closest("[data-node-id]") as HTMLElement | null;
        const targetId = nodeEl?.dataset.nodeId;
        if (targetId && targetId !== act.id) {
          setEdges((prev) =>
            prev.some((ed) => ed.from === act.id && ed.to === targetId)
              ? prev
              : [...prev, { id: uid("e"), from: act.id, to: targetId }]
          );
        }
      }
      interaction.current = null;
      setTempEdge(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [localPoint, setNodes, setStrokes, setEdges, eraseAt]);

  // ----- Node interactions -----
  const onNodePointerDown = (e: ReactPointerEvent, node: MindNode) => {
    if (tool !== "select") return;
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    e.stopPropagation();
    const p = localPoint(e);
    interaction.current = {
      type: "drag-node",
      id: node.id,
      offsetX: p.x - node.x,
      offsetY: p.y - node.y,
    };
  };

  const onHandlePointerDown = (e: ReactPointerEvent, node: MindNode) => {
    e.stopPropagation();
    const p = localPoint(e);
    interaction.current = { type: "connect", id: node.id };
    setTempEdge({ from: node.id, x: p.x, y: p.y });
  };

  const updateNodeText = (id: string, text: string) =>
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));

  const deleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((ed) => ed.from !== id && ed.to !== id));
  };

  const nodeCenter = (id: string) => {
    const n = nodes.find((x) => x.id === id);
    return n ? { x: n.x + 80, y: n.y + 28 } : { x: 0, y: 0 };
  };

  const clearAll = () => {
    if (onClear) onClear();
    else {
      setNodes([]);
      setEdges([]);
      setStrokes([]);
    }
  };

  return (
    <div className="mindmap-wrap">
      <div className="canvas-toolbar">
        <div className="tool-group">
          <button
            className={tool === "select" ? "tool active" : "tool"}
            onClick={() => setTool("select")}
            title="Select / move (double-click canvas to add an idea)"
          >
            ⤧ Move
          </button>
          <button
            className={tool === "pen" ? "tool active" : "tool"}
            onClick={() => setTool("pen")}
            title="Draw freehand (works with a stylus too)"
          >
            ✏️ Pen
          </button>
          <button
            className={tool === "eraser" ? "tool active" : "tool"}
            onClick={() => setTool("eraser")}
            title="Erase pen strokes"
          >
            ⌫ Eraser
          </button>
        </div>

        <div className="tool-group">
          <button
            className="tool primary"
            onClick={() => {
              const rect = surfaceRef.current!.getBoundingClientRect();
              addNode(rect.width / 2 - 80, rect.height / 2 - 28);
              setTool("select");
            }}
          >
            ＋ Add idea
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
                aria-label={`Pen color ${c}`}
              />
            ))}
          </div>
        )}

        <div className="tool-group">
          <button
            className="tool ghost"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            className="tool ghost"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷ Redo
          </button>
        </div>

        <div className="tool-group right">
          <button className="tool ghost" onClick={clearAll} title="Start fresh">
            🗑 Reset
          </button>
        </div>
      </div>

      <div
        ref={surfaceRef}
        className={"mindmap-surface tool-" + tool}
        onPointerDown={onSurfacePointerDown}
        onDoubleClick={(e) => {
          if (e.target !== surfaceRef.current) return;
          if (tool !== "select") return;
          const p = localPoint(e);
          addNode(p.x - 80, p.y - 28);
        }}
      >
        {nodes.length === 0 && strokes.length === 0 && (
          <div className="canvas-hint">
            <p>Sketch out what you think it is.</p>
            <ul>
              <li>
                <b>Double-click</b> anywhere (or <b>＋ Add idea</b>) to drop a concept.
              </li>
              <li>Drag the small dot on a node to <b>connect ideas</b>.</li>
              <li>Switch to <b>✏️ Pen</b> to sketch — I review your labels for now.</li>
            </ul>
          </div>
        )}

        <svg className="edge-layer">
          {edges.map((ed) => {
            const a = nodeCenter(ed.from);
            const b = nodeCenter(ed.to);
            return (
              <line
                key={ed.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="edge-line"
              />
            );
          })}
          {tempEdge && (
            <line
              x1={nodeCenter(tempEdge.from).x}
              y1={nodeCenter(tempEdge.from).y}
              x2={tempEdge.x}
              y2={tempEdge.y}
              className="edge-line temp"
            />
          )}
          {strokes.map((s) => (
            <polyline
              key={s.id}
              className="stroke-line"
              points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
              stroke={s.color}
              strokeWidth={s.width}
            />
          ))}
        </svg>

        {ghostSuggestions.map((ghost, i) => (
          <button
            key={`ghost-${ghost.label}`}
            type="button"
            className="ghost-node"
            style={{
              left: 24 + (i % 3) * 180,
              top: 24 + Math.floor(i / 3) * 72,
            }}
            onClick={() => {
              const rect = surfaceRef.current?.getBoundingClientRect();
              const x = rect ? rect.width / 2 - 80 + i * 20 : 200;
              const y = rect ? rect.height / 2 - 28 + i * 24 : 200;
              onAcceptGhost?.(ghost, x, y);
            }}
            title={ghost.hint}
          >
            + {ghost.label}
          </button>
        ))}

        {nodes.map((node) => {
          const status = nodeStatus[node.id];
          return (
            <div
              key={node.id}
              data-node-id={node.id}
              className={
                "mind-node" +
                (status ? ` status-${status}` : "") +
                (focusedNodeId === node.id ? " focused" : "")
              }
              style={{ left: node.x, top: node.y, borderColor: node.color }}
              onPointerDown={(e) => onNodePointerDown(e, node)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingId(node.id);
              }}
            >
              <span className="node-accent" style={{ background: node.color }} />
              {editingId === node.id ? (
                <textarea
                  ref={(el) => {
                    if (!el) return;
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight + 2}px`;
                    if (document.activeElement !== el) {
                      el.focus();
                      const len = el.value.length;
                      el.setSelectionRange(len, len);
                    }
                  }}
                  value={node.text}
                  placeholder="idea…"
                  onChange={(e) => updateNodeText(node.id, e.target.value)}
                  onBlur={() =>
                    setEditingId((cur) => (cur === node.id ? null : cur))
                  }
                  rows={1}
                />
              ) : (
                <div className="node-text">
                  {node.text || <span className="node-placeholder">idea…</span>}
                </div>
              )}
              {status && <span className={`node-badge ${status}`}>{badge(status)}</span>}
              <span
                className="node-handle"
                title="Drag to connect"
                onPointerDown={(e) => onHandlePointerDown(e, node)}
              />
              <button
                className="node-del"
                title="Delete"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => deleteNode(node.id)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function badge(kind: FeedbackKind) {
  switch (kind) {
    case "good":
      return "✓";
    case "misconception":
      return "✕";
    case "incomplete":
      return "~";
    default:
      return "+";
  }
}
