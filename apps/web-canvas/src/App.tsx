import { useCallback, useState } from "react";
import TopicScreen from "./components/TopicScreen";
import Workspace from "./components/Workspace";
import PracticeScreen from "./components/exam/PracticeScreen";

type Screen = "topics" | "workspace" | "practice";

export default function App() {
  const [screen, setScreen] = useState<Screen>("topics");
  const [topic, setTopic] = useState<string | null>(null);

  const startWorkspace = useCallback((t: string) => {
    setTopic(t);
    setScreen("workspace");
  }, []);

  const startPractice = useCallback(() => {
    setScreen("practice");
  }, []);

  const reset = useCallback(() => {
    setTopic(null);
    setScreen("topics");
  }, []);

  if (screen === "practice") {
    return <PracticeScreen onExit={reset} />;
  }

  if (screen === "workspace" && topic) {
    return <Workspace topic={topic} onExit={reset} />;
  }

  return <TopicScreen onStart={startWorkspace} onStartPractice={startPractice} />;
}
