import { createPRNG } from "@/lib/sudoku/prng";
import { generateBoard, type Board } from "@/lib/sudoku/generator";
import { countSolutions } from "@/lib/sudoku/solver";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Puzzle {
  board: Board; // puzzle with 0s for blanks
  solution: Board; // the full solution
  difficulty: Difficulty;
  clueCount: number;
}

const CLUE_TARGETS: Record<Difficulty, number> = {
  easy: 45,
  medium: 35,
  hard: 27,
  expert: 22,
};

/**
 * Create a puzzle by removing digits from a filled board.
 * Uniqueness is guaranteed — every puzzle has exactly one solution.
 * Same seed + difficulty always produces the same puzzle.
 */
export function createPuzzle(seed: string, difficulty: Difficulty): Puzzle {
  const rng = createPRNG(seed + "-" + difficulty);
  const solution = generateBoard(seed);
  const board = solution.map((row) => [...row]);

  const targetClues = CLUE_TARGETS[difficulty];

  // Shuffle all 81 positions
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  rng.shuffle(positions);

  let clueCount = 81;

  for (const [row, col] of positions) {
    if (clueCount <= targetClues) break;

    const saved = board[row][col];
    board[row][col] = 0;

    if (countSolutions(board, 2) === 1) {
      clueCount--;
    } else {
      board[row][col] = saved; // restore — removal would break uniqueness
    }
  }

  return { board, solution, difficulty, clueCount };
}
