import { useCallback, useReducer } from "react";
import type { CanvasState } from "../lib/types";

const EMPTY: CanvasState = { nodes: [], edges: [], strokes: [] };
const MAX_HISTORY = 50;

interface HistoryState {
  present: CanvasState;
  past: CanvasState[];
  future: CanvasState[];
}

type Action =
  | { type: "set"; next: CanvasState; record?: boolean }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; next: CanvasState };

function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "set": {
      if (action.record === false) {
        return { ...state, present: action.next };
      }
      const past = [...state.past, state.present].slice(-MAX_HISTORY);
      return { present: action.next, past, future: [] };
    }
    case "undo": {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return {
        present: prev,
        past: state.past.slice(0, -1),
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        present: next,
        past: [...state.past, state.present],
        future: state.future.slice(1),
      };
    }
    case "reset":
      return { present: action.next, past: [], future: [] };
    default:
      return state;
  }
}

export function useCanvasHistory(initial: CanvasState = EMPTY) {
  const [history, dispatch] = useReducer(reducer, {
    present: initial,
    past: [],
    future: [],
  });

  const setCanvas = useCallback(
    (updater: CanvasState | ((prev: CanvasState) => CanvasState), record = true) => {
      const next =
        typeof updater === "function" ? updater(history.present) : updater;
      dispatch({ type: "set", next, record });
    },
    [history.present]
  );

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const resetHistory = useCallback(
    (next: CanvasState) => dispatch({ type: "reset", next }),
    []
  );

  return {
    canvas: history.present,
    setCanvas,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    resetHistory,
  };
}
