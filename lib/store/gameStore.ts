import { create } from "zustand";
import type { Puzzle } from "@/lib/sudoku/puzzle";

export interface GameState {
  puzzle: Puzzle | null;
  currentBoard: number[][];
  selectedCell: { row: number; col: number } | null;

  // Actions
  startGame: (puzzle: Puzzle) => void;
  selectCell: (row: number, col: number) => void;
  placeDigit: (digit: number) => void;
  erase: () => void;
}

function emptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
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

  startGame: (puzzle: Puzzle) => {
    set({
      puzzle,
      currentBoard: puzzle.board.map((row) => [...row]),
      selectedCell: null,
    });
  },

  selectCell: (row: number, col: number) => {
    set({ selectedCell: { row, col } });
  },

  placeDigit: (digit: number) => {
    const { selectedCell, puzzle, currentBoard } = get();
    if (!selectedCell || !puzzle) return;
    const { row, col } = selectedCell;
    // No-op on clue cells
    if (puzzle.board[row][col] !== 0) return;
    const newBoard = currentBoard.map((r) => [...r]);
    newBoard[row][col] = digit;
    set({ currentBoard: newBoard });
  },

  erase: () => {
    const { selectedCell, puzzle, currentBoard } = get();
    if (!selectedCell || !puzzle) return;
    const { row, col } = selectedCell;
    // No-op on clue cells
    if (puzzle.board[row][col] !== 0) return;
    const newBoard = currentBoard.map((r) => [...r]);
    newBoard[row][col] = 0;
    set({ currentBoard: newBoard });
  },
}));
