import { create } from "zustand";
import type { Puzzle } from "@/lib/sudoku/puzzle";

export interface GameState {
  puzzle: Puzzle | null;
  currentBoard: number[][];
  selectedCell: { row: number; col: number } | null;
  notesMode: boolean;
  notes: Set<number>[][];

  // Actions
  startGame: (puzzle: Puzzle) => void;
  selectCell: (row: number, col: number) => void;
  placeDigit: (digit: number) => void;
  erase: () => void;
  toggleNotesMode: () => void;
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

export const useGameStore = create<GameState>((set, get) => ({
  puzzle: null,
  currentBoard: emptyBoard(),
  selectedCell: null,
  notesMode: false,
  notes: emptyNotes(),

  startGame: (puzzle: Puzzle) => {
    set({
      puzzle,
      currentBoard: puzzle.board.map((row) => [...row]),
      selectedCell: null,
      notesMode: false,
      notes: emptyNotes(),
    });
  },

  selectCell: (row: number, col: number) => {
    set({ selectedCell: { row, col } });
  },

  placeDigit: (digit: number) => {
    const { selectedCell, puzzle, currentBoard, notesMode, notes } = get();
    if (!selectedCell || !puzzle) return;
    const { row, col } = selectedCell;
    // No-op on clue cells
    if (puzzle.board[row][col] !== 0) return;

    if (notesMode) {
      // Toggle the digit in notes for this cell
      const newNotes = notes.map((r) => r.map((s) => new Set(s)));
      const cellNotes = newNotes[row][col];
      if (cellNotes.has(digit)) {
        cellNotes.delete(digit);
      } else {
        cellNotes.add(digit);
      }
      set({ notes: newNotes });
    } else {
      // Place digit and clear notes for this cell
      const newBoard = currentBoard.map((r) => [...r]);
      newBoard[row][col] = digit;
      const newNotes = notes.map((r) => r.map((s) => new Set(s)));
      newNotes[row][col] = new Set<number>();
      set({ currentBoard: newBoard, notes: newNotes });
    }
  },

  erase: () => {
    const { selectedCell, puzzle, currentBoard, notes } = get();
    if (!selectedCell || !puzzle) return;
    const { row, col } = selectedCell;
    // No-op on clue cells
    if (puzzle.board[row][col] !== 0) return;
    const newBoard = currentBoard.map((r) => [...r]);
    newBoard[row][col] = 0;
    const newNotes = notes.map((r) => r.map((s) => new Set(s)));
    newNotes[row][col] = new Set<number>();
    set({ currentBoard: newBoard, notes: newNotes });
  },

  toggleNotesMode: () => {
    set((state) => ({ notesMode: !state.notesMode }));
  },
}));
