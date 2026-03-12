import { useGameStore } from "@/lib/store/gameStore";
import { useTimerStore } from "@/lib/store/timerStore";
import {
  saveGameState,
  loadGameState,
  hydrateStores,
  getStorageKey,
  initAutoSave,
  clearSavedState,
} from "@/lib/store/autoSave";
import { createPuzzle } from "@/lib/sudoku/puzzle";
import type { Puzzle } from "@/lib/sudoku/puzzle";

const getGameState = () => useGameStore.getState();
const getTimerState = () => useTimerStore.getState();

function makeTestPuzzle(): Puzzle {
  return createPuzzle("auto-save-test", "easy");
}

function findEmptyCell(puzzle: Puzzle): { row: number; col: number } {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle.board[r][c] === 0) return { row: r, col: c };
    }
  }
  throw new Error("No empty cell found");
}

describe("autoSave — Task 4.5", () => {
  let puzzle: Puzzle;

  beforeEach(() => {
    localStorage.clear();
    puzzle = makeTestPuzzle();
    getGameState().startGame(puzzle, { seed: "auto-save-test" });
    getTimerState().reset();
  });

  test("after a move, localStorage contains serialized game state", () => {
    const { row, col } = findEmptyCell(puzzle);
    getGameState().selectCell(row, col);
    getGameState().placeDigit(5);

    saveGameState();
    const raw = localStorage.getItem(getStorageKey());
    expect(raw).not.toBeNull();

    const data = JSON.parse(raw!);
    expect(data.currentBoard[row][col]).toBe(5);
    expect(data.seed).toBe("auto-save-test");
    expect(data.puzzle.difficulty).toBe("easy");
  });

  test("on init with existing localStorage data, store hydrates correctly", () => {
    // Set up some game state
    const { row, col } = findEmptyCell(puzzle);
    getGameState().selectCell(row, col);
    getGameState().placeDigit(puzzle.solution[row][col]);
    getTimerState().setElapsed(120);

    // Save state
    saveGameState();

    // Reset stores
    getGameState().startGame(createPuzzle("other-seed", "hard"));
    getTimerState().reset();
    expect(getGameState().seed).toBeNull();
    expect(getTimerState().elapsed).toBe(0);

    // Load and hydrate
    const data = loadGameState();
    expect(data).not.toBeNull();
    hydrateStores(data!);

    // Verify hydration
    expect(getGameState().currentBoard[row][col]).toBe(puzzle.solution[row][col]);
    expect(getGameState().seed).toBe("auto-save-test");
    expect(getGameState().difficulty).toBe("easy");
    expect(getTimerState().elapsed).toBe(120);
  });

  test("board, notes, timer, error count, and undo stack all restored", () => {
    const { row, col } = findEmptyCell(puzzle);
    getGameState().selectCell(row, col);

    // Add notes
    getGameState().toggleNotesMode();
    getGameState().placeDigit(3);
    getGameState().placeDigit(7);
    getGameState().toggleNotesMode();

    // Place a wrong digit (creates error + undo entry)
    const correct = puzzle.solution[row][col];
    const wrong = correct === 9 ? 1 : correct + 1;
    getGameState().placeDigit(wrong);
    getTimerState().setElapsed(45);

    saveGameState();

    // Reset
    getGameState().startGame(createPuzzle("other", "medium"));
    getTimerState().reset();

    // Hydrate
    const data = loadGameState();
    hydrateStores(data!);

    expect(getGameState().currentBoard[row][col]).toBe(wrong);
    expect(getGameState().errorCount).toBe(1);
    expect(getGameState().undoStack.length).toBe(3); // notes + notes + placeDigit
    expect(getTimerState().elapsed).toBe(45);
  });

  test("different user IDs use different storage keys", () => {
    saveGameState("user-a");
    saveGameState("user-b");

    expect(getStorageKey("user-a")).toBe("nonet:game-state:user-a");
    expect(getStorageKey("user-b")).toBe("nonet:game-state:user-b");
    expect(getStorageKey()).toBe("nonet:game-state");

    expect(localStorage.getItem("nonet:game-state:user-a")).not.toBeNull();
    expect(localStorage.getItem("nonet:game-state:user-b")).not.toBeNull();
  });

  test("notes survive round-trip serialization", () => {
    const { row, col } = findEmptyCell(puzzle);
    getGameState().selectCell(row, col);
    getGameState().toggleNotesMode();
    getGameState().placeDigit(2);
    getGameState().placeDigit(5);
    getGameState().placeDigit(9);

    saveGameState();

    // Reset and hydrate
    getGameState().startGame(createPuzzle("other", "hard"));
    const data = loadGameState();
    hydrateStores(data!);

    const cellNotes = getGameState().notes[row][col];
    expect(cellNotes.has(2)).toBe(true);
    expect(cellNotes.has(5)).toBe(true);
    expect(cellNotes.has(9)).toBe(true);
    expect(cellNotes.size).toBe(3);
  });

  test("initAutoSave subscribes and saves on each store change", () => {
    const unsubscribe = initAutoSave();

    const { row, col } = findEmptyCell(puzzle);
    getGameState().selectCell(row, col);
    getGameState().placeDigit(3);

    const raw = localStorage.getItem(getStorageKey());
    expect(raw).not.toBeNull();
    const data = JSON.parse(raw!);
    expect(data.currentBoard[row][col]).toBe(3);

    unsubscribe();
  });

  test("loadGameState returns null when no data exists", () => {
    const data = loadGameState("nonexistent-user");
    expect(data).toBeNull();
  });

  test("clearSavedState removes the stored data", () => {
    saveGameState();
    expect(localStorage.getItem(getStorageKey())).not.toBeNull();

    clearSavedState();
    expect(localStorage.getItem(getStorageKey())).toBeNull();
  });
});
