import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import QuestionPrompt from "./QuestionPrompt";
import ChoiceList from "./ChoiceList";
import type {
  PracticeQuestion,
  QuestionAttemptState,
  PracticeCheckResponse,
} from "../../lib/examTypes";

interface Props {
  question: PracticeQuestion;
  index: number;
  total: number;
  state: QuestionAttemptState;
  checkResult: PracticeCheckResponse | null;
  checking: boolean;
  onSelectChoice: (id: string) => void;
  onMarkDone: (done: boolean) => void;
  onCheck: () => void;
}

const MIN_HEIGHT = 120;
const MAX_HEIGHT_VH = 0.45;

export default function QuestionPanel({
  question,
  index,
  total,
  state,
  checkResult,
  checking,
  onSelectChoice,
  onMarkDone,
  onCheck,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(220);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const onHandleDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = height;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [height]);

  const onHandleMove = useCallback((e: ReactPointerEvent) => {
    if (!dragging.current) return;
    const maxH = window.innerHeight * MAX_HEIGHT_VH;
    const delta = e.clientY - startY.current;
    setHeight(Math.max(MIN_HEIGHT, Math.min(maxH, startH.current + delta)));
  }, []);

  const onHandleUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const isMC = question.type === "multiple_choice";
  const hasAnswer = isMC ? !!state.selectedChoiceId : !!(state.openEndedDraft?.trim());
  const showResult = !!checkResult;

  return (
    <div className="question-panel" ref={panelRef} style={{ height }}>
      <div className="qp-header">
        <span className="qp-meta">
          Q {index + 1}/{total}
          <span className="qp-subject">{question.subject}</span>
          <span className="qp-difficulty">
            {"●".repeat(question.difficulty)}{"○".repeat(3 - question.difficulty)}
          </span>
        </span>
        <label className="qp-done-toggle">
          <input
            type="checkbox"
            checked={state.status === "done"}
            onChange={(e) => onMarkDone(e.target.checked)}
            aria-label="Mark question as done"
          />
          Mark as Done
        </label>
      </div>

      <div className="qp-body">
        <QuestionPrompt text={question.prompt} />

        {isMC && (
          <ChoiceList
            choices={question.choices}
            selectedId={state.selectedChoiceId}
            correctId={showResult ? checkResult?.correctChoiceId : undefined}
            showResult={showResult}
            disabled={checking}
            onSelect={onSelectChoice}
          />
        )}

        {showResult && checkResult && (
          <div className={`qp-result ${checkResult.correct ? "correct" : "wrong"}`}>
            <span className="qp-result-icon">
              {checkResult.correct ? "✓" : "✕"}
            </span>
            <div>
              <strong>{checkResult.correct ? "Correct!" : "Not quite"}</strong>
              {checkResult.rationale && <p>{checkResult.rationale}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="qp-footer">
        <button
          className="qp-check-btn"
          onClick={onCheck}
          disabled={checking || !hasAnswer}
        >
          {checking ? "Checking..." : showResult ? "Check again" : "Check my answer"}
        </button>
      </div>

      <div
        className="qp-resize-handle"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        aria-label="Resize question panel"
      />
    </div>
  );
}
