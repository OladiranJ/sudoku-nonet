import { getConflicts } from "@/lib/sudoku/conflicts";
import { generateBoard } from "@/lib/sudoku/generator";

// Helper: create a blank 9×9 board
function emptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

describe("getConflicts", () => {
  it("detects row conflicts and returns both cells", () => {
    const board = emptyBoard();
    board[0][0] = 5;
    board[0][4] = 5; // duplicate in row 0

    const conflicts = getConflicts(board);
    expect(conflicts.has("0,0")).toBe(true);
    expect(conflicts.has("0,4")).toBe(true);
    expect(conflicts.size).toBe(2);
  });

  it("detects column conflicts and returns both cells", () => {
    const board = emptyBoard();
    board[1][3] = 7;
    board[6][3] = 7; // duplicate in column 3

    const conflicts = getConflicts(board);
    expect(conflicts.has("1,3")).toBe(true);
    expect(conflicts.has("6,3")).toBe(true);
    expect(conflicts.size).toBe(2);
  });

  it("detects box conflicts and returns both cells", () => {
    const board = emptyBoard();
    board[3][3] = 2;
    board[4][5] = 2; // same 3×3 box (rows 3-5, cols 3-5)

    const conflicts = getConflicts(board);
    expect(conflicts.has("3,3")).toBe(true);
    expect(conflicts.has("4,5")).toBe(true);
    expect(conflicts.size).toBe(2);
  });

  it("returns no conflicts for a valid completed board", () => {
    const board = generateBoard("valid-board-seed");
    const conflicts = getConflicts(board);
    expect(conflicts.size).toBe(0);
  });

  it("ignores empty cells (zeros)", () => {
    const board = emptyBoard();
    // All zeros — no conflicts possible
    const conflicts = getConflicts(board);
    expect(conflicts.size).toBe(0);
  });

  it("detects multiple conflicts simultaneously", () => {
    const board = emptyBoard();
    board[0][0] = 3;
    board[0][8] = 3; // row conflict
    board[5][2] = 9;
    board[7][2] = 9; // column conflict

    const conflicts = getConflicts(board);
    expect(conflicts.has("0,0")).toBe(true);
    expect(conflicts.has("0,8")).toBe(true);
    expect(conflicts.has("5,2")).toBe(true);
    expect(conflicts.has("7,2")).toBe(true);
    expect(conflicts.size).toBe(4);
  });
});
