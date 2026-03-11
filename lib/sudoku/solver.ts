import type { Board } from "@/lib/sudoku/generator";

/**
 * Count the number of solutions for a Sudoku board, up to `limit`.
 * Returns early once `limit` is reached. Does not mutate the input board.
 */
export function countSolutions(board: Board, limit: number = 2): number {
  // Deep copy to avoid mutation
  const grid = board.map((row) => [...row]);
  let count = 0;

  function solve(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] !== 0) continue;

        for (let num = 1; num <= 9; num++) {
          if (!isValid(grid, row, col, num)) continue;

          grid[row][col] = num;
          if (solve()) return true; // limit reached, stop
          grid[row][col] = 0;
        }

        return false; // no valid digit, backtrack
      }
    }

    // All cells filled — found a solution
    count++;
    return count >= limit;
  }

  solve();
  return count;
}

/**
 * Solve a puzzle and return the completed board, or null if unsolvable.
 * Does not mutate the input board.
 */
export function solve(board: Board): Board | null {
  const grid = board.map((row) => [...row]);

  function fill(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] !== 0) continue;

        for (let num = 1; num <= 9; num++) {
          if (!isValid(grid, row, col, num)) continue;
          grid[row][col] = num;
          if (fill()) return true;
          grid[row][col] = 0;
        }

        return false;
      }
    }
    return true;
  }

  return fill() ? grid : null;
}

function isValid(
  board: Board,
  row: number,
  col: number,
  num: number
): boolean {
  // Row check
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  // Column check
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  // Box check
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}
