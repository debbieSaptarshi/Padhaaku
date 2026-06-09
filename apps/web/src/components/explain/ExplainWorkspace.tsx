"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";

import type {
  Feedback,
  FeedbackKind,
  InputMode,
  MindEdge,
  MindNode,
  Stroke,
} from "@/lib/core/types";
import { emitPadhaakuEvent } from "@/lib/core/events";
import { nodesToPayload, nodesToText } from "@/lib/explain/api";

import MindMapCanvas from "./MindMapCanvas";
import TextEditor from "./TextEditor";

export type ExplainDraft = {
  mode: InputMode;
  text: string;
  nodes: MindNode[];
  isEmpty: boolean;
  payloadText: string;
  payloadNodes: { id: string; text: string }[];
};

const ExplainWorkspace = forwardRef<
  { getDraft: () => ExplainDraft },
  {
    topic: string;
    onExit: () => void;
    feedback: Feedback | null;
    focusedNodeId: string | null;
  }
>(function ExplainWorkspace(props, ref) {
  const { topic, onExit, feedback, focusedNodeId } = props;
  const [mode, setMode] = useState<InputMode>("mindmap");
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [edges, setEdges] = useState<MindEdge[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [text, setText] = useState("");

  const getDraft = useCallback((): ExplainDraft => {
    const payloadText =
      mode === "text" ? text : `${text ? `${text}. ` : ""}${nodesToText(nodes)}`;
    const payloadNodes = mode === "mindmap" ? nodesToPayload(nodes) : [];
    const isEmpty =
      mode === "text"
        ? text.trim().length === 0
        : nodes.every((n) => !n.text.trim()) && nodes.length === 0;
    return { mode, text, nodes, isEmpty, payloadText, payloadNodes };
  }, [mode, text, nodes]);

  useImperativeHandle(ref, () => ({ getDraft }), [getDraft]);

  useEffect(() => {
    const d = getDraft();
    emitPadhaakuEvent({ type: "explain:draft_changed", hasContent: !d.isEmpty });
  }, [getDraft]);

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

  return (
    <div className="workspace explain-workspace">
      <header className="ws-header">
        <button type="button" className="back-btn" onClick={onExit} title="Choose another topic">
          ←
        </button>
        <div className="ws-prompt">
          <span className="ws-eyebrow">Haku asks</span>
          <h2>
            What do you think <span className="grad-text">{topic}</span> is?
          </h2>
        </div>
        <div className="mode-toggle" role="tablist" aria-label="Input mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "mindmap"}
            className={mode === "mindmap" ? "active" : ""}
            onClick={() => setMode("mindmap")}
          >
            🕸 Mind map
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "text"}
            className={mode === "text" ? "active" : ""}
            onClick={() => setMode("text")}
          >
            ✍️ Type
          </button>
        </div>
      </header>

      <div className="ws-body ws-body-canvas-only">
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
      </div>
    </div>
  );
});

export default ExplainWorkspace;
