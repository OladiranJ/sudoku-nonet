import { generateBoard, type Board } from "@/lib/sudoku/generator";

function isValidBoard(board: Board): boolean {
  // Check dimensions
  if (board.length !== 9) return false;
  for (const row of board) {
    if (row.length !== 9) return false;
  }

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Set(board[r]);
    if (seen.size !== 9) return false;
    for (let n = 1; n <= 9; n++) {
      if (!seen.has(n)) return false;
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < 9; r++) seen.add(board[r][c]);
    if (seen.size !== 9) return false;
  }

  // Check 3×3 boxes
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const seen = new Set<number>();
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          seen.add(board[r][c]);
        }
      }
      if (seen.size !== 9) return false;
    }
  }

  return true;
}

describe("generateBoard", () => {
  it("generates a valid 9×9 Sudoku board", () => {
    const board = generateBoard("validity-test");
    expect(isValidBoard(board)).toBe(true);
  });

  it("same seed produces identical board", () => {
    const a = generateBoard("determinism");
    const b = generateBoard("determinism");
    expect(a).toEqual(b);
  });

  it("different seeds produce different boards (10 seeds)", () => {
    const boards = Array.from({ length: 10 }, (_, i) =>
      generateBoard(`seed-${i}`)
    );

    // Each pair should differ
    for (let i = 0; i < boards.length; i++) {
      for (let j = i + 1; j < boards.length; j++) {
        expect(boards[i]).not.toEqual(boards[j]);
      }
    }
  });

  it("all 10 generated boards are valid", () => {
    for (let i = 0; i < 10; i++) {
      const board = generateBoard(`multi-validity-${i}`);
      expect(isValidBoard(board)).toBe(true);
    }
  });
});
