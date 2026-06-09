import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MindMapCanvas from "./MindMapCanvas";
import HandwritingCanvas, { type HandwritingCanvasHandle } from "./HandwritingCanvas";
import TextEditor from "./TextEditor";
import FeedbackPanel from "./FeedbackPanel";
import MasteryCelebration from "./MasteryCelebration";
import { requestFeedback, nodesToPayload, nodesToText } from "../lib/api";
import { captureHandwritingImage, strokeStats } from "../lib/canvasExport";
import { createSession, loadSession, saveSession } from "../lib/session";
import type {
  Attempt,
  Feedback,
  FeedbackKind,
  InputMode,
  MindEdge,
  MindNode,
  Stroke,
} from "../lib/types";

const MIN_TEXT_CHARS = 20;

export default function Workspace({
  topic,
  onExit,
}: {
  topic: string;
  onExit: () => void;
}) {
  const hwRef = useRef<HandwritingCanvasHandle>(null);

  const [mode, setMode] = useState<InputMode>("handwriting");
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [edges, setEdges] = useState<MindEdge[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [text, setText] = useState("");
  const [handwritingStrokes, setHandwritingStrokes] = useState<Stroke[]>([]);
  const [handwritingCaption, setHandwritingCaption] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState(Date.now());

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [lastEditAt, setLastEditAt] = useState(Date.now());

  // Restore session
  useEffect(() => {
    const saved = loadSession(topic);
    if (saved) {
      setMode(saved.mode);
      setNodes(saved.nodes);
      setEdges(saved.edges);
      setStrokes(saved.strokes);
      setText(saved.text);
      setHandwritingStrokes(saved.handwritingStrokes);
      setHandwritingCaption(saved.handwritingCaption);
      setAttempts(saved.attempts);
      setSessionStartedAt(saved.sessionStartedAt);
    } else {
      const fresh = createSession(topic);
      setSessionStartedAt(fresh.sessionStartedAt);
    }
  }, [topic]);

  // Persist draft
  useEffect(() => {
    const t = window.setTimeout(() => {
      saveSession({
        topic,
        mode,
        nodes,
        edges,
        strokes,
        text,
        handwritingStrokes,
        handwritingCaption,
        attempts,
        sessionStartedAt,
        updatedAt: Date.now(),
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [
    topic,
    mode,
    nodes,
    edges,
    strokes,
    text,
    handwritingStrokes,
    handwritingCaption,
    attempts,
    sessionStartedAt,
  ]);

  const markEdited = useCallback(() => setLastEditAt(Date.now()), []);

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

  const isEmpty = useMemo(() => {
    if (mode === "text") return text.trim().length < MIN_TEXT_CHARS;
    if (mode === "handwriting") {
      const { pointCount } = strokeStats(handwritingStrokes);
      const captionLen = handwritingCaption.trim().length;
      return pointCount < 15 && captionLen < MIN_TEXT_CHARS;
    }
    const hasNodes = nodes.some((n) => n.text.trim().length > 0);
    const hasInk = strokes.some((s) => s.points.length > 2);
    return !hasNodes && !hasInk;
  }, [mode, text, nodes, strokes, handwritingStrokes, handwritingCaption]);

  const previousScore = attempts.length ? attempts[attempts.length - 1].score : null;
  const attemptNumber = attempts.length + 1;

  const check = async () => {
    setLoading(true);
    setError(null);
    try {
      let payloadText = "";
      let payloadStrokes: Stroke[] = [];
      let handwritingImage: string | null = null;

      if (mode === "text") {
        payloadText = text;
      } else if (mode === "handwriting") {
        payloadText = handwritingCaption;
        payloadStrokes = handwritingStrokes;
        const size = hwRef.current?.getSize();
        if (size) {
          handwritingImage = captureHandwritingImage(
            handwritingStrokes,
            size.width,
            size.height
          );
        }
      } else {
        payloadText = `${text ? text + ". " : ""}${nodesToText(nodes)}`;
        payloadStrokes = strokes;
      }

      const fb = await requestFeedback({
        topic,
        mode,
        text: payloadText,
        nodes: mode === "mindmap" ? nodesToPayload(nodes) : [],
        edges: mode === "mindmap" ? edges.map((e) => ({ from: e.from, to: e.to })) : [],
        strokes: payloadStrokes,
        handwritingImage,
        attemptNumber,
        previousScore,
        sessionStartedAt,
      });

      setFeedback(fb);
      const attempt: Attempt = {
        id: `a-${Date.now()}`,
        score: fb.score,
        timestamp: Date.now(),
        mode,
      };
      setAttempts((prev) => [...prev, attempt]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: InputMode) => {
    setMode(next);
    setFeedback(null);
    setError(null);
  };

  const refineNudge =
    feedback && Date.now() - lastEditAt < 5000
      ? "Take a moment to refine your explanation, then check again."
      : null;

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
          {attempts.length > 0 && (
            <span className="ws-attempts">
              Attempt {attempts.length}
              {previousScore !== null ? ` · last score ${previousScore}` : ""}
            </span>
          )}
        </div>
        <div className="mode-toggle" role="tablist" aria-label="Input mode">
          <button
            role="tab"
            aria-selected={mode === "handwriting"}
            className={mode === "handwriting" ? "active" : ""}
            onClick={() => switchMode("handwriting")}
          >
            ✍️ Write
          </button>
          <button
            role="tab"
            aria-selected={mode === "mindmap"}
            className={mode === "mindmap" ? "active" : ""}
            onClick={() => switchMode("mindmap")}
          >
            🕸 Mind map
          </button>
          <button
            role="tab"
            aria-selected={mode === "text"}
            className={mode === "text" ? "active" : ""}
            onClick={() => switchMode("text")}
          >
            ⌨️ Type
          </button>
        </div>
      </header>

      <div className="ws-body">
        <main className="ws-canvas-area">
          {mode === "handwriting" ? (
            <HandwritingCanvas
              ref={hwRef}
              strokes={handwritingStrokes}
              setStrokes={(up) => {
                markEdited();
                setHandwritingStrokes(up);
              }}
              caption={handwritingCaption}
              onCaptionChange={(v) => {
                markEdited();
                setHandwritingCaption(v);
              }}
            />
          ) : mode === "mindmap" ? (
            <MindMapCanvas
              nodes={nodes}
              edges={edges}
              strokes={strokes}
              setNodes={(up) => {
                markEdited();
                setNodes(up);
              }}
              setEdges={setEdges}
              setStrokes={(up) => {
                markEdited();
                setStrokes(up);
              }}
              nodeStatus={nodeStatus}
              focusedNodeId={focusedNodeId}
            />
          ) : (
            <TextEditor
              value={text}
              onChange={(v) => {
                markEdited();
                setText(v);
              }}
              feedback={feedback}
            />
          )}
        </main>

        <FeedbackPanel
          topic={topic}
          feedback={feedback}
          loading={loading}
          error={error}
          isEmpty={isEmpty}
          refineNudge={refineNudge}
          onCheck={check}
          onHoverItem={setFocusedNodeId}
          masterySlot={
            feedback?.masteryReached ? <MasteryCelebration topic={topic} /> : null
          }
        />
      </div>
    </div>
  );
}
