import { getDailySeed } from "@/lib/sudoku/daily";
import { createPuzzle } from "@/lib/sudoku/puzzle";
import { countSolutions } from "@/lib/sudoku/solver";

describe("getDailySeed", () => {
  it("same date + difficulty produces the same seed", () => {
    const a = getDailySeed("2025-01-15", "hard");
    const b = getDailySeed("2025-01-15", "hard");
    expect(a).toBe(b);
  });

  it("different dates produce different seeds", () => {
    const a = getDailySeed("2025-01-15", "easy");
    const b = getDailySeed("2025-01-16", "easy");
    expect(a).not.toBe(b);
  });

  it("different difficulties on the same date produce different seeds", () => {
    const date = "2025-06-01";
    const seeds = [
      getDailySeed(date, "easy"),
      getDailySeed(date, "medium"),
      getDailySeed(date, "hard"),
      getDailySeed(date, "expert"),
    ];
    const unique = new Set(seeds);
    expect(unique.size).toBe(4);
  });

  it("seed produces a valid puzzle with a unique solution", () => {
    const seed = getDailySeed("2025-03-10", "medium");
    const puzzle = createPuzzle(seed, "medium");

    // Puzzle board has blanks
    const blanks = puzzle.board.flat().filter((c) => c === 0).length;
    expect(blanks).toBeGreaterThan(0);

    // Solution is fully filled
    const filled = puzzle.solution.flat().every((c) => c >= 1 && c <= 9);
    expect(filled).toBe(true);

    // Exactly one solution
    expect(countSolutions(puzzle.board, 2)).toBe(1);
  });
});
