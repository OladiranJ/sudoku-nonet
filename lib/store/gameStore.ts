import { create } from "zustand";
import type { Puzzle } from "@/lib/sudoku/puzzle";
import type { Difficulty } from "@/lib/sudoku/puzzle";
import { useTimerStore } from "@/lib/store/timerStore";
import { useDailyStore } from "@/lib/store/dailyStore";

export interface BoardSnapshot {
  board: number[][];
  notes: number[][][]; // serialized form of Set<number>[][] for JSON compatibility
}

export interface StartGameOptions {
  seed?: string;
  isDaily?: boolean;
  puzzleDate?: string;
}

export interface GameState {
  puzzle: Puzzle | null;
  currentBoard: number[][];
  selectedCell: { row: number; col: number } | null;
  notesMode: boolean;
  notes: Set<number>[][];

  // Metadata
  difficulty: Difficulty | null;
  seed: string | null;
  isDaily: boolean;
  puzzleDate: string | null;

  // Derived
  isComplete: boolean;

  // Error tracking (monotonic — never decremented)
  errorCount: number;

  // Undo/Redo
  undoStack: BoardSnapshot[];
  redoStack: BoardSnapshot[];

  // Actions
  startGame: (puzzle: Puzzle, options?: StartGameOptions) => void;
  selectCell: (row: number, col: number) => void;
  placeDigit: (digit: number) => void;
  erase: () => void;
  toggleNotesMode: () => void;
  undo: () => void;
  redo: () => void;
  hydrateGame: (data: HydrateData) => void;
}

export interface HydrateData {
  puzzle: Puzzle;
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
}

function emptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function emptyNotes(): Set<number>[][] {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );
}

export function getDigitCounts(board: number[][]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let d = 1; d <= 9; d++) counts[d] = 0;
  for (const row of board) {
    for (const val of row) {
      if (val >= 1 && val <= 9) counts[val]++;
    }
  }
  return counts;
}

function computeIsComplete(board: number[][], solution: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export function serializeNotes(notes: Set<number>[][]): number[][][] {
  return notes.map((row) => row.map((cell) => [...cell].sort()));
}

export function deserializeNotes(data: number[][][]): Set<number>[][] {
  return data.map((row) => row.map((cell) => new Set(cell)));
}

function captureSnapshot(board: number[][], notes: Set<number>[][]): BoardSnapshot {
  return {
    board: board.map((r) => [...r]),
    notes: serializeNotes(notes),
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  puzzle: null,
  currentBoard: emptyBoard(),
  selectedCell: null,
  notesMode: false,
  notes: emptyNotes(),

  difficulty: null,
  seed: null,
  isDaily: false,
  puzzleDate: null,
  isComplete: false,
  errorCount: 0,
  undoStack: [],
  redoStack: [],

  startGame: (puzzle: Puzzle, options?: StartGameOptions) => {
    set({
      puzzle,
      currentBoard: puzzle.board.map((row) => [...row]),
      selectedCell: null,
      notesMode: false,
      notes: emptyNotes(),
      difficulty: puzzle.difficulty,
      seed: options?.seed ?? null,
      isDaily: options?.isDaily ?? false,
      puzzleDate: options?.puzzleDate ?? null,
      isComplete: false,
      errorCount: 0,
      undoStack: [],
      redoStack: [],
    });
  },

  selectCell: (row: number, col: number) => {
    set({ selectedCell: { row, col } });
  },

  placeDigit: (digit: number) => {
    const { selectedCell, puzzle, currentBoard, notesMode, notes, errorCount, undoStack } = get();
    if (!selectedCell || !puzzle) return;
    const { row, col } = selectedCell;
    if (puzzle.board[row][col] !== 0) return;

    // Capture snapshot before mutation
    const snapshot = captureSnapshot(currentBoard, notes);

    if (notesMode) {
      const newNotes = notes.map((r) => r.map((s) => new Set(s)));
      const cellNotes = newNotes[row][col];
      if (cellNotes.has(digit)) {
        cellNotes.delete(digit);
      } else {
        cellNotes.add(digit);
      }
      set({
        notes: newNotes,
        undoStack: [...undoStack, snapshot],
        redoStack: [],
      });
    } else {
      const newBoard = currentBoard.map((r) => [...r]);
      newBoard[row][col] = digit;
      const newNotes = notes.map((r) => r.map((s) => new Set(s)));
      newNotes[row][col] = new Set<number>();

      const newIsComplete = computeIsComplete(newBoard, puzzle.solution);
      const isError = digit !== puzzle.solution[row][col];

      set({
        currentBoard: newBoard,
        notes: newNotes,
        isComplete: newIsComplete,
        errorCount: isError ? errorCount + 1 : errorCount,
        undoStack: [...undoStack, snapshot],
        redoStack: [],
      });

      if (newIsComplete) {
        useTimerStore.getState().stop();
        const state = get();
        if (state.isDaily && state.puzzleDate && state.difficulty) {
          const elapsed = useTimerStore.getState().elapsed;
          useDailyStore.getState().markCompleted(state.difficulty, state.puzzleDate, elapsed);
        }
      }
    }
  },

  erase: () => {
    const { selectedCell, puzzle, currentBoard, notes, undoStack } = get();
    if (!selectedCell || !puzzle) return;
    const { row, col } = selectedCell;
    if (puzzle.board[row][col] !== 0) return;

    // Capture snapshot before mutation
    const snapshot = captureSnapshot(currentBoard, notes);

    const newBoard = currentBoard.map((r) => [...r]);
    newBoard[row][col] = 0;
    const newNotes = notes.map((r) => r.map((s) => new Set(s)));
    newNotes[row][col] = new Set<number>();

    set({
      currentBoard: newBoard,
      notes: newNotes,
      isComplete: false, // erasing a cell means board is incomplete
      undoStack: [...undoStack, snapshot],
      redoStack: [],
    });
  },

  toggleNotesMode: () => {
    set((state) => ({ notesMode: !state.notesMode }));
  },

  undo: () => {
    const { undoStack, currentBoard, notes, puzzle, redoStack } = get();
    if (undoStack.length === 0) return;

    const currentSnapshot = captureSnapshot(currentBoard, notes);
    const prev = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    const restoredNotes = deserializeNotes(prev.notes);
    const restoredBoard = prev.board.map((r) => [...r]);
    const newIsComplete = puzzle
      ? computeIsComplete(restoredBoard, puzzle.solution)
      : false;

    set({
      currentBoard: restoredBoard,
      notes: restoredNotes,
      isComplete: newIsComplete,
      undoStack: newUndoStack,
      redoStack: [...redoStack, currentSnapshot],
    });
  },

  redo: () => {
    const { redoStack, currentBoard, notes, puzzle, undoStack } = get();
    if (redoStack.length === 0) return;

    const currentSnapshot = captureSnapshot(currentBoard, notes);
    const next = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    const restoredNotes = deserializeNotes(next.notes);
    const restoredBoard = next.board.map((r) => [...r]);
    const newIsComplete = puzzle
      ? computeIsComplete(restoredBoard, puzzle.solution)
      : false;

    set({
      currentBoard: restoredBoard,
      notes: restoredNotes,
      isComplete: newIsComplete,
      undoStack: [...undoStack, currentSnapshot],
      redoStack: newRedoStack,
    });
  },

  hydrateGame: (data: HydrateData) => {
    set({
      puzzle: data.puzzle,
      currentBoard: data.currentBoard.map((r) => [...r]),
      notes: deserializeNotes(data.notes),
      selectedCell: data.selectedCell,
      notesMode: data.notesMode,
      difficulty: data.difficulty,
      seed: data.seed,
      isDaily: data.isDaily,
      puzzleDate: data.puzzleDate,
      isComplete: data.puzzle
        ? computeIsComplete(data.currentBoard, data.puzzle.solution)
        : false,
      errorCount: data.errorCount,
      undoStack: data.undoStack,
      redoStack: data.redoStack,
    });
  },
}));
