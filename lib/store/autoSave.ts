import { useGameStore, serializeNotes, type BoardSnapshot, type HydrateData } from "@/lib/store/gameStore";
import { useTimerStore } from "@/lib/store/timerStore";
import type { Puzzle, Difficulty } from "@/lib/sudoku/puzzle";

const STORAGE_PREFIX = "nonet:game-state";

export interface SerializedGameState {
  puzzle: {
    board: number[][];
    solution: number[][];
    difficulty: Difficulty;
    clueCount: number;
  };
  currentBoard: number[][];
  notes: number[][][];
  selectedCell: { row: number; col: number } | null;
  notesMode: boolean;
  difficulty: Difficulty | null;
  seed: string | null;
  isDaily: boolean;
  puzzleDate: string | null;
  errorCount: number;
  undoStack: BoardSnapshot[];
  redoStack: BoardSnapshot[];
  elapsed: number;
}

export function getStorageKey(userId?: string): string {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

export function saveGameState(userId?: string): void {
  const gameState = useGameStore.getState();
  const timerState = useTimerStore.getState();

  if (!gameState.puzzle) return;

  const data: SerializedGameState = {
    puzzle: {
      board: gameState.puzzle.board,
      solution: gameState.puzzle.solution,
      difficulty: gameState.puzzle.difficulty,
      clueCount: gameState.puzzle.clueCount,
    },
    currentBoard: gameState.currentBoard,
    notes: serializeNotes(gameState.notes),
    selectedCell: gameState.selectedCell,
    notesMode: gameState.notesMode,
    difficulty: gameState.difficulty,
    seed: gameState.seed,
    isDaily: gameState.isDaily,
    puzzleDate: gameState.puzzleDate,
    errorCount: gameState.errorCount,
    undoStack: gameState.undoStack,
    redoStack: gameState.redoStack,
    elapsed: timerState.elapsed,
  };

  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
  } catch {
    // localStorage may be full or unavailable — silently fail
  }
}

export function loadGameState(userId?: string): SerializedGameState | null {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as SerializedGameState;
  } catch {
    return null;
  }
}

export function hydrateStores(data: SerializedGameState): void {
  const puzzle: Puzzle = {
    board: data.puzzle.board,
    solution: data.puzzle.solution,
    difficulty: data.puzzle.difficulty,
    clueCount: data.puzzle.clueCount,
  };

  const hydrateData: HydrateData = {
    puzzle,
    currentBoard: data.currentBoard,
    notes: data.notes,
    selectedCell: data.selectedCell,
    notesMode: data.notesMode,
    difficulty: data.difficulty,
    seed: data.seed,
    isDaily: data.isDaily,
    puzzleDate: data.puzzleDate,
    errorCount: data.errorCount,
    undoStack: data.undoStack,
    redoStack: data.redoStack,
  };

  useGameStore.getState().hydrateGame(hydrateData);
  useTimerStore.getState().setElapsed(data.elapsed);
}

export function clearSavedState(userId?: string): void {
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch {
    // silently fail
  }
}

export function initAutoSave(userId?: string): () => void {
  return useGameStore.subscribe(() => {
    saveGameState(userId);
  });
}
