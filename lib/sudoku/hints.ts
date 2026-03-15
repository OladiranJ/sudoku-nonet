import type { Board } from "@/lib/sudoku/generator";

/**
 * Find an empty cell that is a "naked single" — only one valid digit
 * given the current board constraints. Returns the cell coordinates,
 * or null if no such cell exists (all remaining cells require guessing).
 *
 * Does NOT reveal the answer — only returns {row, col}.
 */
export function findHintCell(
  board: Board,
  solution: Board
): { row: number; col: number } | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0) continue;

      const candidates = getCandidates(board, row, col);
      if (candidates.length === 1) {
        return { row, col };
      }
    }
  }

  // No naked singles found — return null
  return null;
}

/**
 * Get all valid candidate digits for an empty cell.
 */
function getCandidates(board: Board, row: number, col: number): number[] {
  const used = new Set<number>();

  // Row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] !== 0) used.add(board[row][c]);
  }

  // Column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] !== 0) used.add(board[r][col]);
  }

  // Box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] !== 0) used.add(board[r][c]);
    }
  }

  const candidates: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (!used.has(d)) candidates.push(d);
  }
  return candidates;
}
