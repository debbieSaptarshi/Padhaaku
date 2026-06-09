import { useCallback, useEffect, useState } from "react";
import QuestionPanel from "./QuestionPanel";
import { useExamSession } from "../../hooks/useExamSession";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function PracticeScreen({ onExit }: { onExit: () => void }) {
  const {
    loading,
    error,
    checking,
    checkResult,
    currentIndex,
    total,
    currentQuestion,
    currentState,
    goNext,
    goPrev,
    selectChoice,
    markDone,
    checkCurrentAnswer,
  } = useExamSession("default");

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const handleCheck = useCallback(() => {
    checkCurrentAnswer();
  }, [checkCurrentAnswer]);

  if (loading) {
    return (
      <div className="practice-screen">
        <div className="practice-loading">Loading practice set...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="practice-screen">
        <div className="practice-error">
          <p>{error}</p>
          <button onClick={onExit}>← Back</button>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !currentState) {
    return (
      <div className="practice-screen">
        <div className="practice-loading">No questions available.</div>
      </div>
    );
  }

  return (
    <div className="practice-screen">
      <header className="exam-header">
        <button className="back-btn" onClick={onExit} title="Back to topics">
          ←
        </button>
        <span className="exam-timer">Time: {formatTime(elapsed)}</span>
        <div className="exam-nav">
          <button
            className="exam-nav-btn"
            onClick={goPrev}
            disabled={currentIndex === 0}
            aria-label="Previous question"
          >
            ‹
          </button>
          <span className="exam-nav-label">
            Q {currentIndex + 1}/{total}
          </span>
          <button
            className="exam-nav-btn"
            onClick={goNext}
            disabled={currentIndex >= total - 1}
            aria-label="Next question"
          >
            ›
          </button>
        </div>
        <div className="exam-header-spacer" />
      </header>

      <QuestionPanel
        question={currentQuestion}
        index={currentIndex}
        total={total}
        state={currentState}
        checkResult={checkResult}
        checking={checking}
        onSelectChoice={selectChoice}
        onMarkDone={markDone}
        onCheck={handleCheck}
      />

      <div className="practice-workspace">
        <div className="canvas-hint">
          <p>Workspace canvas</p>
          <ul>
            <li>Draw your working here (canvas connects in Phase 2)</li>
            <li>Use the toolbar above to write, sketch, or graph</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
