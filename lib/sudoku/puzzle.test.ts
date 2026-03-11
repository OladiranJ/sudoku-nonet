import { createPuzzle, type Difficulty } from "@/lib/sudoku/puzzle";
import { countSolutions } from "@/lib/sudoku/solver";

const CLUE_TARGETS: Record<Difficulty, number> = {
  easy: 45,
  medium: 35,
  hard: 27,
  expert: 22,
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

function getClueCount(board: number[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== 0) count++;
    }
  }
  return count;
}

describe("createPuzzle", () => {
  it.each(DIFFICULTIES)(
    "%s difficulty produces clue count within ±3 of target",
    (difficulty) => {
      const puzzle = createPuzzle("clue-count-test", difficulty);
      const target = CLUE_TARGETS[difficulty];
      const actual = getClueCount(puzzle.board);
      expect(actual).toBe(puzzle.clueCount);
      expect(actual).toBeGreaterThanOrEqual(target - 3);
      expect(actual).toBeLessThanOrEqual(target + 3);
    }
  );

  it.each(DIFFICULTIES)(
    "%s: every puzzle has exactly one solution (5 puzzles)",
    (difficulty) => {
      for (let i = 0; i < 5; i++) {
        const puzzle = createPuzzle(`unique-${difficulty}-${i}`, difficulty);
        expect(countSolutions(puzzle.board, 2)).toBe(1);
      }
    }
  );

  it("same seed + difficulty produces identical puzzle", () => {
    const a = createPuzzle("determinism", "medium");
    const b = createPuzzle("determinism", "medium");
    expect(a.board).toEqual(b.board);
    expect(a.solution).toEqual(b.solution);
    expect(a.clueCount).toBe(b.clueCount);
  });

  it("different difficulties on same seed produce different puzzles", () => {
    const easy = createPuzzle("same-seed", "easy");
    const hard = createPuzzle("same-seed", "hard");
    expect(easy.board).not.toEqual(hard.board);
    expect(easy.clueCount).toBeGreaterThan(hard.clueCount);
  });

  it("puzzle board blanks match solution where clues are present", () => {
    const puzzle = createPuzzle("consistency-check", "medium");
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle.board[r][c] !== 0) {
          expect(puzzle.board[r][c]).toBe(puzzle.solution[r][c]);
        }
      }
    }
  });
});
