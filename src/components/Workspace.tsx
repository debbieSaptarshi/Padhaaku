import { useCallback, useEffect, useMemo, useState } from "react";
import MindMapCanvas from "./MindMapCanvas";
import TextEditor from "./TextEditor";
import FeedbackPanel from "./FeedbackPanel";
import RevisionBanner from "./RevisionBanner";
import MasteryScreen from "./MasteryScreen";
import {
  requestFeedback,
  nodesToPayload,
  nodesToText,
  edgesToPayload,
} from "../lib/api";
import { useCanvasHistory } from "../hooks/useHistory";
import {
  loadSession,
  clearSession,
  useSessionPersistence,
} from "../hooks/useSession";
import type {
  Feedback,
  FeedbackKind,
  InputMode,
  MindNode,
  SessionAttempt,
  SessionSnapshot,
  SuggestedNode,
} from "../lib/types";

const NODE_COLORS = ["#7c5cff", "#22d3ee", "#34d399", "#fbbf24", "#fb7185", "#f472b6"];
let colorCursor = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${colorCursor++}`;

export default function Workspace({
  topic,
  onExit,
}: {
  topic: string;
  onExit: () => void;
}) {
  const saved = useMemo(() => loadSession(topic), [topic]);

  const [mode, setMode] = useState<InputMode>(saved?.mode ?? "mindmap");
  const { canvas, setCanvas, undo, redo, canUndo, canRedo, resetHistory } =
    useCanvasHistory({
      nodes: saved?.nodes ?? [],
      edges: saved?.edges ?? [],
      strokes: saved?.strokes ?? [],
    });
  const { nodes, edges, strokes } = canvas;

  const [text, setText] = useState(saved?.text ?? "");
  const [feedback, setFeedback] = useState<Feedback | null>(saved?.lastFeedback ?? null);
  const [attempts, setAttempts] = useState<SessionAttempt[]>(saved?.attempts ?? []);
  const [attemptNumber, setAttemptNumber] = useState(saved?.attemptNumber ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [showMastery, setShowMastery] = useState(
    saved?.lastFeedback?.mastery.achieved ?? false
  );
  const [welcomeBack, setWelcomeBack] = useState(
    Boolean(saved && (saved.nodes.length > 0 || saved.text.trim()))
  );
  const [showOnboarding, setShowOnboarding] = useState(!saved?.onboardingDone);

  const setNodes = useCallback(
    (u: React.SetStateAction<MindNode[]>) =>
      setCanvas((c) => ({
        ...c,
        nodes: typeof u === "function" ? u(c.nodes) : u,
      })),
    [setCanvas]
  );
  const setEdges = useCallback(
    (u: React.SetStateAction<typeof edges>) =>
      setCanvas((c) => ({
        ...c,
        edges: typeof u === "function" ? u(c.edges) : u,
      })),
    [setCanvas]
  );
  const setStrokes = useCallback(
    (u: React.SetStateAction<typeof strokes>) =>
      setCanvas((c) => ({
        ...c,
        strokes: typeof u === "function" ? u(c.strokes) : u,
      })),
    [setCanvas]
  );

  const snapshot: SessionSnapshot = useMemo(
    () => ({
      topic,
      mode,
      nodes,
      edges,
      strokes,
      text,
      attempts,
      lastFeedback: feedback,
      attemptNumber,
      onboardingDone: !showOnboarding,
    }),
    [topic, mode, nodes, edges, strokes, text, attempts, feedback, attemptNumber, showOnboarding]
  );

  useSessionPersistence(topic, snapshot);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

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

  const ghostSuggestions = useMemo(() => {
    if (!feedback || mode !== "mindmap") return [];
    return feedback.suggestedNodes.filter(
      (s) => !nodes.some((n) => n.text.toLowerCase().includes(s.label.toLowerCase().slice(0, 8)))
    );
  }, [feedback, nodes, mode]);

  const check = async (unlockModelAnswer = false) => {
    setLoading(true);
    setError(null);
    const prevScore = feedback?.score ?? null;
    const nextAttempt = attemptNumber + 1;
    try {
      const payloadText =
        mode === "text" ? text : `${text ? text + ". " : ""}${nodesToText(nodes)}`;
      const fb = await requestFeedback({
        topic,
        mode,
        text: payloadText,
        nodes: mode === "mindmap" ? nodesToPayload(nodes) : [],
        edges: mode === "mindmap" ? edgesToPayload(edges) : [],
        attemptNumber: nextAttempt,
        previousScore: prevScore,
        unlockModelAnswer,
      });
      setFeedback(fb);
      setAttemptNumber(nextAttempt);
      setAttempts((prev) => [
        ...prev,
        {
          at: new Date().toISOString(),
          score: fb.score,
          itemCount: {
            good: fb.items.filter((i) => i.kind === "good").length,
            missing: fb.items.filter((i) => i.kind === "missing").length,
            misconception: fb.items.filter((i) => i.kind === "misconception").length,
          },
        },
      ]);
      if (fb.mastery.achieved) setShowMastery(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const addSuggestedNode = useCallback(
    (s: SuggestedNode, x?: number, y?: number) => {
      const id = uid("n");
      const color = NODE_COLORS[colorCursor % NODE_COLORS.length];
      const rect = { width: 800, height: 500 };
      setNodes((prev) => [
        ...prev,
        {
          id,
          x: x ?? rect.width / 2 - 80 + prev.length * 24,
          y: y ?? rect.height / 2 - 28 + prev.length * 20,
          text: s.label,
          color,
        },
      ]);
    },
    [setNodes]
  );

  const startFresh = () => {
    if (!confirm("Clear this session and start over?")) return;
    clearSession(topic);
    resetHistory({ nodes: [], edges: [], strokes: [] });
    setText("");
    setFeedback(null);
    setAttempts([]);
    setAttemptNumber(0);
    setShowMastery(false);
    setWelcomeBack(false);
  };

  const exportMap = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `padhaaku-${topic.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const isEmpty =
    mode === "text"
      ? text.trim().length === 0
      : nodes.every((n) => !n.text.trim()) && nodes.length === 0;

  return (
    <div className="workspace">
      {showMastery && feedback && (
        <MasteryScreen
          topicLabel={feedback.topicLabel}
          score={feedback.score}
          attempts={attempts}
          onAnother={onExit}
          onExport={exportMap}
        />
      )}

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

      {welcomeBack && (
        <div className="welcome-back">
          Welcome back — your work was restored.{" "}
          <button type="button" onClick={() => setWelcomeBack(false)}>
            Dismiss
          </button>
        </div>
      )}

      {showOnboarding && mode === "mindmap" && (
        <div className="onboarding-tip">
          <span>
            <b>Tip:</b> Double-click the canvas to add ideas, drag the dot to connect them,
            then hit <b>Check my understanding</b>.
          </span>
          <button type="button" onClick={() => setShowOnboarding(false)}>
            Got it
          </button>
        </div>
      )}

      {feedback && !showMastery && (
        <RevisionBanner feedback={feedback} onAddSuggested={addSuggestedNode} />
      )}

      <div className="ws-body">
        <main className={`ws-canvas-area${loading ? " readonly" : ""}`}>
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
              ghostSuggestions={ghostSuggestions}
              onAcceptGhost={addSuggestedNode}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onClear={startFresh}
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
          attempts={attempts}
          onCheck={() => check(false)}
          onStuck={() => check(true)}
          onHoverItem={setFocusedNodeId}
          onStartFresh={startFresh}
        />
      </div>
    </div>
  );
}
