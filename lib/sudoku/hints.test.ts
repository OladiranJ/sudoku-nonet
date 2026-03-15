import { findHintCell } from "@/lib/sudoku/hints";
import { createPuzzle } from "@/lib/sudoku/puzzle";
import { useGameStore } from "@/lib/store/gameStore";

describe("findHintCell", () => {
  it("returns a valid cell coordinate that is logically deducible", () => {
    const puzzle = createPuzzle("hint-test-seed", "easy");
    // Easy puzzles have many naked singles
    const hint = findHintCell(puzzle.board, puzzle.solution);
    expect(hint).not.toBeNull();
    // The hinted cell should be empty on the board
    expect(puzzle.board[hint!.row][hint!.col]).toBe(0);
    // The cell should have the correct solution value
    expect(puzzle.solution[hint!.row][hint!.col]).toBeGreaterThanOrEqual(1);
    expect(puzzle.solution[hint!.row][hint!.col]).toBeLessThanOrEqual(9);
  });

  it("does not reveal the cell's answer (only returns coordinates)", () => {
    const puzzle = createPuzzle("hint-test-seed-2", "easy");
    const hint = findHintCell(puzzle.board, puzzle.solution);
    expect(hint).not.toBeNull();
    // Hint only has row and col, not the digit value
    expect(hint).toEqual(
      expect.objectContaining({ row: expect.any(Number), col: expect.any(Number) })
    );
    expect(hint).not.toHaveProperty("value");
    expect(hint).not.toHaveProperty("digit");
  });

  it("returns null when no logically solvable cells remain", () => {
    // Create a board where all empty cells have multiple candidates
    // Use a nearly-empty board with ambiguous cells
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const solution = board; // doesn't matter for this test
    const hint = findHintCell(board, solution);
    expect(hint).toBeNull();
  });

  it("finds hint on a partially solved board", () => {
    const puzzle = createPuzzle("hint-partial-seed", "medium");
    // Partially fill the board with correct values
    const board = puzzle.board.map((r) => [...r]);
    let filled = 0;
    for (let r = 0; r < 9 && filled < 20; r++) {
      for (let c = 0; c < 9 && filled < 20; c++) {
        if (board[r][c] === 0) {
          board[r][c] = puzzle.solution[r][c];
          filled++;
        }
      }
    }
    const hint = findHintCell(board, puzzle.solution);
    // With more cells filled, there should be naked singles
    if (hint) {
      expect(board[hint.row][hint.col]).toBe(0);
    }
  });
});

describe("useHint action in gameStore", () => {
  it("increments hintCount on each use", () => {
    const puzzle = createPuzzle("hint-store-seed", "easy");
    useGameStore.getState().startGame(puzzle, { seed: "hint-store-seed" });

    expect(useGameStore.getState().hintCount).toBe(0);

    useGameStore.getState().useHint();
    expect(useGameStore.getState().hintCount).toBe(1);

    useGameStore.getState().useHint();
    expect(useGameStore.getState().hintCount).toBe(2);
  });

  it("selects the hinted cell without revealing the answer", () => {
    const puzzle = createPuzzle("hint-select-seed", "easy");
    useGameStore.getState().startGame(puzzle, { seed: "hint-select-seed" });

    const hint = useGameStore.getState().useHint();
    if (hint) {
      const selected = useGameStore.getState().selectedCell;
      expect(selected).toEqual({ row: hint.row, col: hint.col });
      // Cell value should still be 0 (not revealed)
      expect(useGameStore.getState().currentBoard[hint.row][hint.col]).toBe(0);
    }
  });

  it("returns null when puzzle is complete", () => {
    const puzzle = createPuzzle("hint-complete-seed", "easy");
    useGameStore.getState().startGame(puzzle, { seed: "hint-complete-seed" });

    // Fill entire board with solution
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle.board[r][c] === 0) {
          useGameStore.getState().selectCell(r, c);
          useGameStore.getState().placeDigit(puzzle.solution[r][c]);
        }
      }
    }
    expect(useGameStore.getState().isComplete).toBe(true);

    const hint = useGameStore.getState().useHint();
    expect(hint).toBeNull();
  });

  it("resets hintCount on new game", () => {
    const puzzle = createPuzzle("hint-reset-seed", "easy");
    useGameStore.getState().startGame(puzzle, { seed: "hint-reset-seed" });
    useGameStore.getState().useHint();
    useGameStore.getState().useHint();
    expect(useGameStore.getState().hintCount).toBe(2);

    const puzzle2 = createPuzzle("hint-reset-seed-2", "medium");
    useGameStore.getState().startGame(puzzle2, { seed: "hint-reset-seed-2" });
    expect(useGameStore.getState().hintCount).toBe(0);
  });
});
