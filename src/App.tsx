import { useCallback, useState } from "react";
import TopicScreen from "./components/TopicScreen";
import Workspace from "./components/Workspace";

export default function App() {
  const [topic, setTopic] = useState<string | null>(null);

  const start = useCallback((t: string) => setTopic(t), []);
  const reset = useCallback(() => setTopic(null), []);

  return topic ? (
    <Workspace topic={topic} onExit={reset} />
  ) : (
    <TopicScreen onStart={start} />
  );
}
