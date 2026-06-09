export type QuestionType = "open_ended" | "multiple_choice";

export type Choice = {
  id: string;
  label: string;
};

export type PracticeQuestionBase = {
  id: string;
  conceptId: string;
  subject: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  hints: string[];
  explanation: string;
  focusPoint?: string;
};

export type OpenEndedQuestion = PracticeQuestionBase & {
  type: "open_ended";
  answerKeywords: string[];
};

export type MultipleChoiceQuestion = PracticeQuestionBase & {
  type: "multiple_choice";
  choices: Choice[];
  correctChoiceId: string;
  choiceRationale?: Record<string, string>;
};

export type PracticeQuestion = OpenEndedQuestion | MultipleChoiceQuestion;

export type QuestionStatus = "unseen" | "in_progress" | "done";

export type QuestionAttemptState = {
  questionId: string;
  status: QuestionStatus;
  selectedChoiceId?: string;
  openEndedDraft?: string;
  score?: number;
  correct?: boolean;
  checkedAt?: number;
};

export type ExamSession = {
  setId: string;
  questionIds: string[];
  currentIndex: number;
  startedAt: number;
  questionStates: Record<string, QuestionAttemptState>;
};

export type PracticeSetResponse = {
  setId: string;
  title: string;
  questions: PracticeQuestion[];
};

export type PracticeCheckRequest = {
  questionId: string;
  conceptId: string;
  responseType: QuestionType;
  selectedChoiceId?: string;
  response?: string;
  mastery?: Record<string, number>;
};

export type PracticeCheckResponse = {
  score: number;
  masteryDelta: number;
  correct?: boolean;
  correctChoiceId?: string;
  rationale?: string;
};
