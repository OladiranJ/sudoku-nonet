import { useGameStore } from "@/lib/store/gameStore";
import { createPuzzle } from "@/lib/sudoku/puzzle";
import type { Puzzle } from "@/lib/sudoku/puzzle";

// Helper to get store state
const getState = () => useGameStore.getState();

// Create a test puzzle with known solution
function makeTestPuzzle(): Puzzle {
  return createPuzzle("test-seed-4.1", "easy");
}

// Find the first empty cell in a puzzle
function findEmptyCell(puzzle: Puzzle): { row: number; col: number } {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle.board[r][c] === 0) return { row: r, col: c };
    }
  }
  throw new Error("No empty cell found");
}

// Find a clue cell
function findClueCell(puzzle: Puzzle): { row: number; col: number } {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle.board[r][c] !== 0) return { row: r, col: c };
    }
  }
  throw new Error("No clue cell found");
}

describe("gameStore — Task 4.1", () => {
  let puzzle: Puzzle;

  beforeEach(() => {
    puzzle = makeTestPuzzle();
    getState().startGame(puzzle);
  });

  test("placeDigit updates the cell value", () => {
    const { row, col } = findEmptyCell(puzzle);
    getState().selectCell(row, col);
    getState().placeDigit(5);
    expect(getState().currentBoard[row][col]).toBe(5);
  });

  test("erase clears the cell value", () => {
    const { row, col } = findEmptyCell(puzzle);
    getState().selectCell(row, col);
    getState().placeDigit(5);
    expect(getState().currentBoard[row][col]).toBe(5);
    getState().erase();
    expect(getState().currentBoard[row][col]).toBe(0);
  });

  test("selectCell updates the selected cell", () => {
    getState().selectCell(3, 4);
    expect(getState().selectedCell).toEqual({ row: 3, col: 4 });
  });

  test("toggleNotesMode switches mode", () => {
    expect(getState().notesMode).toBe(false);
    getState().toggleNotesMode();
    expect(getState().notesMode).toBe(true);
    getState().toggleNotesMode();
    expect(getState().notesMode).toBe(false);
  });

  test("placing a digit on a clue cell is a no-op", () => {
    const { row, col } = findClueCell(puzzle);
    const originalValue = getState().currentBoard[row][col];
    getState().selectCell(row, col);
    getState().placeDigit(1);
    expect(getState().currentBoard[row][col]).toBe(originalValue);
  });

  test("isComplete returns true only when all cells match the solution", () => {
    expect(getState().isComplete).toBe(false);

    // Fill every empty cell with the correct solution value
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle.board[r][c] === 0) {
          getState().selectCell(r, c);
          getState().placeDigit(puzzle.solution[r][c]);
        }
      }
    }
    expect(getState().isComplete).toBe(true);
  });

  test("isComplete returns false when one cell is wrong", () => {
    // Fill all empty cells correctly except the last one
    const emptyCells: { row: number; col: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle.board[r][c] === 0) emptyCells.push({ row: r, col: c });
      }
    }

    for (let i = 0; i < emptyCells.length - 1; i++) {
      const { row, col } = emptyCells[i];
      getState().selectCell(row, col);
      getState().placeDigit(puzzle.solution[row][col]);
    }

    // Place a wrong digit in the last empty cell
    const last = emptyCells[emptyCells.length - 1];
    const correctDigit = puzzle.solution[last.row][last.col];
    const wrongDigit = correctDigit === 9 ? 1 : correctDigit + 1;
    getState().selectCell(last.row, last.col);
    getState().placeDigit(wrongDigit);

    expect(getState().isComplete).toBe(false);
  });

  test("startGame with options sets metadata", () => {
    getState().startGame(puzzle, {
      seed: "my-seed",
      isDaily: true,
      puzzleDate: "2026-03-12",
    });
    expect(getState().seed).toBe("my-seed");
    expect(getState().isDaily).toBe(true);
    expect(getState().puzzleDate).toBe("2026-03-12");
    expect(getState().difficulty).toBe("easy");
  });

  test("startGame resets errorCount, undoStack, redoStack", () => {
    // Place a wrong digit to increment errorCount
    const { row, col } = findEmptyCell(puzzle);
    const correct = puzzle.solution[row][col];
    const wrong = correct === 9 ? 1 : correct + 1;
    getState().selectCell(row, col);
    getState().placeDigit(wrong);
    expect(getState().errorCount).toBeGreaterThan(0);
    expect(getState().undoStack.length).toBeGreaterThan(0);

    // Start a new game — everything resets
    getState().startGame(puzzle);
    expect(getState().errorCount).toBe(0);
    expect(getState().undoStack).toEqual([]);
    expect(getState().redoStack).toEqual([]);
  });

  test("startGame without options defaults metadata to null/false", () => {
    getState().startGame(puzzle);
    expect(getState().seed).toBeNull();
    expect(getState().isDaily).toBe(false);
    expect(getState().puzzleDate).toBeNull();
  });
});

describe("gameStore — Task 4.4: Undo/Redo", () => {
  let puzzle: Puzzle;

  beforeEach(() => {
    puzzle = makeTestPuzzle();
    getState().startGame(puzzle);
  });

  test("after placing a digit, undo restores previous state", () => {
    const { row, col } = findEmptyCell(puzzle);
    getState().selectCell(row, col);
    getState().placeDigit(5);
    expect(getState().currentBoard[row][col]).toBe(5);

    getState().undo();
    expect(getState().currentBoard[row][col]).toBe(0);
  });

  test("after undo, redo restores the digit", () => {
    const { row, col } = findEmptyCell(puzzle);
    getState().selectCell(row, col);
    getState().placeDigit(7);
    getState().undo();
    expect(getState().currentBoard[row][col]).toBe(0);

    getState().redo();
    expect(getState().currentBoard[row][col]).toBe(7);
  });

  test("undo past the beginning is a no-op", () => {
    const boardBefore = getState().currentBoard.map((r) => [...r]);
    getState().undo();
    const boardAfter = getState().currentBoard;
    expect(boardAfter).toEqual(boardBefore);
  });

  test("redo past the end is a no-op", () => {
    const { row, col } = findEmptyCell(puzzle);
    getState().selectCell(row, col);
    getState().placeDigit(3);
    const boardBefore = getState().currentBoard.map((r) => [...r]);

    getState().redo();
    expect(getState().currentBoard).toEqual(boardBefore);
  });

  test("notes are correctly restored on undo", () => {
    const { row, col } = findEmptyCell(puzzle);
    getState().selectCell(row, col);

    // Enter pencil mode and add notes
    getState().toggleNotesMode();
    getState().placeDigit(1);
    getState().placeDigit(4);
    expect(getState().notes[row][col].has(1)).toBe(true);
    expect(getState().notes[row][col].has(4)).toBe(true);

    // Switch to pen mode and place a digit (clears notes)
    getState().toggleNotesMode();
    getState().placeDigit(5);
    expect(getState().notes[row][col].size).toBe(0);
    expect(getState().currentBoard[row][col]).toBe(5);

    // Undo should restore the notes
    getState().undo();
    expect(getState().currentBoard[row][col]).toBe(0);
    expect(getState().notes[row][col].has(1)).toBe(true);
    expect(getState().notes[row][col].has(4)).toBe(true);
  });

  test("starting a new game clears the undo stack", () => {
    const { row, col } = findEmptyCell(puzzle);
    getState().selectCell(row, col);
    getState().placeDigit(3);
    expect(getState().undoStack.length).toBe(1);

    getState().startGame(puzzle);
    expect(getState().undoStack).toEqual([]);
    expect(getState().redoStack).toEqual([]);
  });

  test("new action after undo clears redo stack", () => {
    const { row, col } = findEmptyCell(puzzle);
    getState().selectCell(row, col);
    getState().placeDigit(3);
    getState().undo();
    expect(getState().redoStack.length).toBe(1);

    getState().placeDigit(7);
    expect(getState().redoStack).toEqual([]);
  });
});

describe("gameStore — Task 4.2: Error Tracking", () => {
  let puzzle: Puzzle;

  beforeEach(() => {
    puzzle = makeTestPuzzle();
    getState().startGame(puzzle);
  });

  test("placing an incorrect digit increments errorCount", () => {
    const { row, col } = findEmptyCell(puzzle);
    const correct = puzzle.solution[row][col];
    const wrong = correct === 9 ? 1 : correct + 1;

    getState().selectCell(row, col);
    getState().placeDigit(wrong);
    expect(getState().errorCount).toBe(1);
  });

  test("placing a correct digit does not increment errorCount", () => {
    const { row, col } = findEmptyCell(puzzle);
    const correct = puzzle.solution[row][col];

    getState().selectCell(row, col);
    getState().placeDigit(correct);
    expect(getState().errorCount).toBe(0);
  });

  test("undoing an incorrect digit does not decrement errorCount", () => {
    const { row, col } = findEmptyCell(puzzle);
    const correct = puzzle.solution[row][col];
    const wrong = correct === 9 ? 1 : correct + 1;

    getState().selectCell(row, col);
    getState().placeDigit(wrong);
    expect(getState().errorCount).toBe(1);

    getState().undo();
    expect(getState().errorCount).toBe(1); // still 1, not decremented
  });

  test("error count persists across undo/redo", () => {
    const { row, col } = findEmptyCell(puzzle);
    const correct = puzzle.solution[row][col];
    const wrong = correct === 9 ? 1 : correct + 1;

    getState().selectCell(row, col);
    getState().placeDigit(wrong); // errorCount -> 1
    getState().undo();
    getState().redo();
    expect(getState().errorCount).toBe(1);

    // Place another wrong digit
    getState().erase();
    const wrong2 = correct === 8 ? 1 : correct + 2;
    getState().placeDigit(wrong2); // errorCount -> 2
    expect(getState().errorCount).toBe(2);

    getState().undo();
    expect(getState().errorCount).toBe(2); // still 2
  });
});
