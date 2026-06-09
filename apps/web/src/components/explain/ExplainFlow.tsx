"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/shell/AppShell";
import type { Feedback } from "@/lib/core/types";
import { emitPadhaakuEvent, subscribePadhaakuEvents } from "@/lib/core/events";
import { requestFeedback } from "@/lib/explain/api";
import {
  clearExplainSession,
  createSessionId,
  loadExplainSession,
  saveExplainSession,
} from "@/lib/explain/session";

import ExplainWorkspace, { type ExplainDraft } from "./ExplainWorkspace";
import TopicPicker from "./TopicPicker";

export function ExplainFlow() {
  const workspaceRef = useRef<{ getDraft: () => ExplainDraft }>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [modelAnswerFull, setModelAnswerFull] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const saved = loadExplainSession();
    if (saved?.topic) {
      setTopic(saved.topic);
      setSessionId(saved.sessionId);
      setRoundNumber(saved.roundNumber);
      setLastScore(saved.lastScore);
    }
  }, []);

  useEffect(() => {
    return subscribePadhaakuEvents((event) => {
      if (event.type === "explain:draft_changed") {
        setIsEmpty(!event.hasContent);
      }
    });
  }, []);

  const startTopic = useCallback((t: string) => {
    const sid = createSessionId();
    setTopic(t);
    setSessionId(sid);
    setRoundNumber(1);
    setLastScore(null);
    setFeedback(null);
    setModelAnswerFull("");
    setError(null);
    setIsEmpty(true);
    saveExplainSession({ sessionId: sid, topic: t, roundNumber: 1, lastScore: null });
    emitPadhaakuEvent({ type: "topic:selected", topic: t, mode: "explain" });
  }, []);

  const exitTopic = useCallback(() => {
    setTopic(null);
    clearExplainSession();
    setFeedback(null);
    setModelAnswerFull("");
    setRoundNumber(1);
    setLastScore(null);
    setSessionId(null);
    setIsEmpty(true);
  }, []);

  const check = useCallback(async () => {
    const draft = workspaceRef.current?.getDraft();
    if (!draft || draft.isEmpty || !topic) return;

    setLoading(true);
    setError(null);

    try {
      const fb = await requestFeedback({
        topic,
        mode: draft.mode,
        text: draft.payloadText,
        nodes: draft.payloadNodes,
        roundNumber,
        previousScore: lastScore,
        sessionId: sessionId ?? undefined,
      });

      if (fb.modelAnswer) {
        setModelAnswerFull(fb.modelAnswer);
      }

      setFeedback(fb);
      setLastScore(fb.score);
      emitPadhaakuEvent({ type: "explain:checked", feedback: fb });

      if (sessionId) {
        saveExplainSession({
          sessionId,
          topic,
          roundNumber,
          lastScore: fb.score,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [topic, roundNumber, lastScore, sessionId]);

  const revise = useCallback(() => {
    setRoundNumber((r) => {
      const next = r + 1;
      if (sessionId && topic) {
        saveExplainSession({
          sessionId,
          topic,
          roundNumber: next,
          lastScore,
        });
      }
      return next;
    });
    setFocusedNodeId(null);
  }, [sessionId, topic, lastScore]);

  return (
    <AppShell
      variant="explain"
      haku={{
        active: Boolean(topic),
        topic,
        feedback,
        loading,
        error,
        isEmpty,
        roundNumber,
        onCheck: check,
        onHoverItem: setFocusedNodeId,
        onRevise: revise,
        modelAnswerFull,
      }}
    >
      <div className="explain-theme explain-flow">
        {topic ? (
          <ExplainWorkspace
            ref={workspaceRef}
            topic={topic}
            onExit={exitTopic}
            feedback={feedback}
            focusedNodeId={focusedNodeId}
          />
        ) : (
          <TopicPicker onStart={startTopic} />
        )}
      </div>
    </AppShell>
  );
}
