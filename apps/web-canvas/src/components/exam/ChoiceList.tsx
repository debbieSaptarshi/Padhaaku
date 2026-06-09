import { MathText } from "./QuestionPrompt";
import type { Choice } from "../../lib/examTypes";

interface Props {
  choices: Choice[];
  selectedId?: string;
  correctId?: string;
  showResult: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
}

export default function ChoiceList({
  choices,
  selectedId,
  correctId,
  showResult,
  disabled,
  onSelect,
}: Props) {
  return (
    <fieldset className="choice-list" role="radiogroup" aria-label="Answer choices">
      <legend className="sr-only">Choose your answer</legend>
      {choices.map((choice) => {
        const isSelected = choice.id === selectedId;
        const isCorrect = showResult && choice.id === correctId;
        const isWrong = showResult && isSelected && choice.id !== correctId;

        let stateClass = "";
        if (isCorrect) stateClass = "correct";
        else if (isWrong) stateClass = "wrong";
        else if (isSelected) stateClass = "selected";

        return (
          <button
            key={choice.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`choice-option ${stateClass}`}
            disabled={disabled || (showResult && !isSelected && !isCorrect)}
            onClick={() => onSelect(choice.id)}
          >
            <span className="choice-letter">{choice.id}</span>
            <span className="choice-label">
              <MathText text={choice.label} />
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
