export type Board = number[][];

/**
 * Finds all cells involved in a conflict (duplicate non-zero values
 * in the same row, column, or 3×3 box).
 *
 * Returns a Set of "row,col" strings identifying conflicting cells.
 */
export function getConflicts(board: Board): Set<string> {
  const conflicts = new Set<string>();

  for (let i = 0; i < 9; i++) {
    // Row conflicts
    checkGroup(
      board,
      conflicts,
      Array.from({ length: 9 }, (_, c) => [i, c])
    );

    // Column conflicts
    checkGroup(
      board,
      conflicts,
      Array.from({ length: 9 }, (_, r) => [r, i])
    );
  }

  // Box conflicts
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const cells: [number, number][] = [];
      for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
          cells.push([r, c]);
        }
      }
      checkGroup(board, conflicts, cells);
    }
  }

  return conflicts;
}

function checkGroup(
  board: Board,
  conflicts: Set<string>,
  cells: [number, number][]
): void {
  const seen = new Map<number, [number, number][]>();

  for (const [r, c] of cells) {
    const val = board[r][c];
    if (val === 0) continue;

    const existing = seen.get(val);
    if (existing) {
      existing.push([r, c]);
    } else {
      seen.set(val, [[r, c]]);
    }
  }

  for (const positions of seen.values()) {
    if (positions.length > 1) {
      for (const [r, c] of positions) {
        conflicts.add(`${r},${c}`);
      }
    }
  }
}
