"use client";

import { useCallback, useState } from "react";

import TopicScreen from "@/components/canvas/TopicScreen";
import Workspace from "@/components/canvas/Workspace";

import "./learn.css";

export default function LearnPage() {
  const [topic, setTopic] = useState<string | null>(null);
  const start = useCallback((t: string) => setTopic(t), []);
  const reset = useCallback(() => setTopic(null), []);

  return (
    <div className="learn-root" style={{ height: "100vh" }}>
      {topic ? (
        <Workspace topic={topic} onExit={reset} />
      ) : (
        <TopicScreen onStart={start} />
      )}
    </div>
  );
}
