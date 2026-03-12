import type { Difficulty } from "@/lib/sudoku/puzzle";

/**
 * Derives a deterministic seed for daily puzzles.
 * Same date + difficulty always produces the same seed,
 * which in turn produces the same puzzle for every player.
 */
export function getDailySeed(date: string, difficulty: Difficulty): string {
  return `${date}-${difficulty}`;
}
