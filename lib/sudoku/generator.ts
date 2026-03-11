import { createPRNG, type PRNG } from "@/lib/sudoku/prng";

export type Board = number[][];

/**
 * Generate a valid, fully-filled 9×9 Sudoku board from a seed string.
 * Same seed always produces the same board.
 */
export function generateBoard(seed: string): Board {
  const rng = createPRNG(seed);
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board, rng);
  return board;
}

function fillBoard(board: Board, rng: PRNG): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0) continue;

      const candidates = getCandidates(board, row, col);
      rng.shuffle(candidates);

      for (const num of candidates) {
        board[row][col] = num;
        if (fillBoard(board, rng)) return true;
        board[row][col] = 0;
      }

      return false; // no candidate works, backtrack
    }
  }
  return true; // all cells filled
}

function getCandidates(board: Board, row: number, col: number): number[] {
  const used = new Set<number>();

  // Row
  for (let c = 0; c < 9; c++) used.add(board[row][c]);
  // Column
  for (let r = 0; r < 9; r++) used.add(board[r][col]);
  // 3×3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      used.add(board[r][c]);
    }
  }

  const candidates: number[] = [];
  for (let n = 1; n <= 9; n++) {
    if (!used.has(n)) candidates.push(n);
  }
  return candidates;
}
