import { useMemo, useState } from "react";
import MindMapCanvas from "./MindMapCanvas";
import TextEditor from "./TextEditor";
import FeedbackPanel from "./FeedbackPanel";
import { requestFeedback, nodesToPayload, nodesToText } from "../lib/api";
import type {
  Feedback,
  FeedbackKind,
  InputMode,
  MindEdge,
  MindNode,
  Stroke,
} from "../lib/types";

export default function Workspace({
  topic,
  onExit,
}: {
  topic: string;
  onExit: () => void;
}) {
  const [mode, setMode] = useState<InputMode>("mindmap");

  // Mind-map state
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [edges, setEdges] = useState<MindEdge[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  // Text state
  const [text, setText] = useState("");

  // Feedback state
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Map of nodeId -> worst feedback kind, used to glow specific nodes.
  const nodeStatus = useMemo(() => {
    const map: Record<string, FeedbackKind> = {};
    const rank: Record<FeedbackKind, number> = {
      misconception: 3,
      incomplete: 2,
      missing: 1,
      good: 0,
    };
    feedback?.items.forEach((i) => {
      if (i.nodeId) {
        if (!map[i.nodeId] || rank[i.kind] > rank[map[i.nodeId]]) {
          map[i.nodeId] = i.kind;
        }
      }
    });
    return map;
  }, [feedback]);

  const check = async () => {
    setLoading(true);
    setError(null);
    try {
      const payloadText =
        mode === "text" ? text : `${text ? text + ". " : ""}${nodesToText(nodes)}`;
      const fb = await requestFeedback({
        topic,
        mode,
        text: payloadText,
        nodes: mode === "mindmap" ? nodesToPayload(nodes) : [],
      });
      setFeedback(fb);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isEmpty =
    mode === "text"
      ? text.trim().length === 0
      : nodes.every((n) => !n.text.trim()) && nodes.length === 0;

  return (
    <div className="workspace">
      <header className="ws-header">
        <button className="back-btn" onClick={onExit} title="Choose another topic">
          ←
        </button>
        <div className="ws-prompt">
          <span className="ws-eyebrow">Your study buddy asks</span>
          <h2>
            What do you think <span className="grad-text">{topic}</span> is?
          </h2>
        </div>
        <div className="mode-toggle" role="tablist" aria-label="Input mode">
          <button
            role="tab"
            aria-selected={mode === "mindmap"}
            className={mode === "mindmap" ? "active" : ""}
            onClick={() => setMode("mindmap")}
          >
            🕸 Mind map
          </button>
          <button
            role="tab"
            aria-selected={mode === "text"}
            className={mode === "text" ? "active" : ""}
            onClick={() => setMode("text")}
          >
            ✍️ Type
          </button>
        </div>
      </header>

      <div className="ws-body">
        <main className="ws-canvas-area">
          {mode === "mindmap" ? (
            <MindMapCanvas
              nodes={nodes}
              edges={edges}
              strokes={strokes}
              setNodes={setNodes}
              setEdges={setEdges}
              setStrokes={setStrokes}
              nodeStatus={nodeStatus}
              focusedNodeId={focusedNodeId}
            />
          ) : (
            <TextEditor value={text} onChange={setText} feedback={feedback} />
          )}
        </main>

        <FeedbackPanel
          topic={topic}
          feedback={feedback}
          loading={loading}
          error={error}
          isEmpty={isEmpty}
          onCheck={check}
          onHoverItem={setFocusedNodeId}
        />
      </div>
    </div>
  );
}
