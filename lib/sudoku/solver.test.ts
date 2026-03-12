import { solve, countSolutions } from "@/lib/sudoku/solver";
import { createPuzzle } from "@/lib/sudoku/puzzle";
import { generateBoard } from "@/lib/sudoku/generator";
import type { Board } from "@/lib/sudoku/generator";

/**
 * Create an unsolvable board: start from a full valid board, clear cell [0][0],
 * then overwrite [1][0] with the value that was at [0][0]. Now cell [0][0]'s
 * only candidate is blocked by column 0, so no digit can go there.
 * The board is nearly full, so the solver fails instantly.
 */
function createInvalidBoard(): Board {
  const full = generateBoard("invalid-test-seed");
  const board = full.map((row) => [...row]);
  const val = board[0][0];
  board[0][0] = 0;
  board[1][0] = val; // block the only candidate for [0][0] via column
  return board;
}

describe("Sudoku Solver", () => {
  describe("solve()", () => {
    test("solves a known Easy puzzle correctly", () => {
      const puzzle = createPuzzle("easy-test-seed", "easy");
      const solved = solve(puzzle.board);

      expect(solved).not.toBeNull();
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(solved![r][c]).toBe(puzzle.solution[r][c]);
        }
      }
    });

    test("solves a known Expert puzzle correctly", () => {
      const puzzle = createPuzzle("expert-test-seed", "expert");
      const solved = solve(puzzle.board);

      expect(solved).not.toBeNull();
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(solved![r][c]).toBe(puzzle.solution[r][c]);
        }
      }
    });

    test("returns null for an invalid (unsolvable) puzzle", () => {
      // Nearly-full board with a row conflict — solver fails fast
      const board = createInvalidBoard();
      const solved = solve(board);
      expect(solved).toBeNull();
    });

    test("does not mutate the input board", () => {
      const puzzle = createPuzzle("immutability-solve", "easy");
      const snapshot = puzzle.board.map((row) => [...row]);
      solve(puzzle.board);

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(puzzle.board[r][c]).toBe(snapshot[r][c]);
        }
      }
    });
  });

  describe("countSolutions()", () => {
    test("returns 1 solution for a unique puzzle", () => {
      const puzzle = createPuzzle("unique-count-seed", "medium");
      const count = countSolutions(puzzle.board, 2);
      expect(count).toBe(1);
    });

    test("returns 2 solutions for an ambiguous puzzle (crafted test case)", () => {
      // Take a unique puzzle and remove one extra clue to break uniqueness.
      const puzzle = createPuzzle("ambiguous-craft-seed", "easy");
      const board = puzzle.board.map((row) => [...row]);

      let madeAmbiguous = false;
      for (let r = 0; r < 9 && !madeAmbiguous; r++) {
        for (let c = 0; c < 9 && !madeAmbiguous; c++) {
          if (board[r][c] === 0) continue;
          const saved = board[r][c];
          board[r][c] = 0;
          if (countSolutions(board, 2) > 1) {
            madeAmbiguous = true;
          } else {
            board[r][c] = saved;
          }
        }
      }

      expect(madeAmbiguous).toBe(true);
      const count = countSolutions(board, 2);
      expect(count).toBe(2);
    });

    test("returns 0 solutions for an invalid puzzle", () => {
      // Nearly-full board with a conflict — solver fails fast
      const board = createInvalidBoard();
      const count = countSolutions(board, 2);
      expect(count).toBe(0);
    });

    test("does not mutate the input board", () => {
      const puzzle = createPuzzle("immutability-count", "easy");
      const snapshot = puzzle.board.map((row) => [...row]);
      countSolutions(puzzle.board, 2);

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(puzzle.board[r][c]).toBe(snapshot[r][c]);
        }
      }
    });
  });
});
