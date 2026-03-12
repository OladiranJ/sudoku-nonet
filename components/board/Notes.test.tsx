import { render, screen } from "@testing-library/react";
import Board from "@/components/board/Board";
import { useGameStore } from "@/lib/store/gameStore";
import { createPuzzle } from "@/lib/sudoku/puzzle";

const puzzle = createPuzzle("notes-test-seed", "easy");

function findEmptyCell(): { row: number; col: number } {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle.board[r][c] === 0) {
        return { row: r, col: c };
      }
    }
  }
  throw new Error("No empty cell found");
}

beforeEach(() => {
  useGameStore.getState().startGame(puzzle);
});

describe("Notes / Pencil mode", () => {
  it("toggling pencil mode changes store state", () => {
    expect(useGameStore.getState().notesMode).toBe(false);

    useGameStore.getState().toggleNotesMode();
    expect(useGameStore.getState().notesMode).toBe(true);

    useGameStore.getState().toggleNotesMode();
    expect(useGameStore.getState().notesMode).toBe(false);
  });

  it("in pencil mode, entering a digit adds it as a note (not a final value)", () => {
    const { row, col } = findEmptyCell();
    useGameStore.getState().selectCell(row, col);
    useGameStore.getState().toggleNotesMode();

    useGameStore.getState().placeDigit(3);

    // Cell value should remain 0
    expect(useGameStore.getState().currentBoard[row][col]).toBe(0);
    // Note should contain digit 3
    expect(useGameStore.getState().notes[row][col].has(3)).toBe(true);
  });

  it("entering the same digit again removes the note", () => {
    const { row, col } = findEmptyCell();
    useGameStore.getState().selectCell(row, col);
    useGameStore.getState().toggleNotesMode();

    useGameStore.getState().placeDigit(5);
    expect(useGameStore.getState().notes[row][col].has(5)).toBe(true);

    useGameStore.getState().placeDigit(5);
    expect(useGameStore.getState().notes[row][col].has(5)).toBe(false);
  });

  it("placing a final value clears all notes in that cell", () => {
    const { row, col } = findEmptyCell();
    useGameStore.getState().selectCell(row, col);

    // Add some notes
    useGameStore.getState().toggleNotesMode();
    useGameStore.getState().placeDigit(1);
    useGameStore.getState().placeDigit(4);
    useGameStore.getState().placeDigit(7);
    expect(useGameStore.getState().notes[row][col].size).toBe(3);

    // Switch to pen mode and place a final digit
    useGameStore.getState().toggleNotesMode();
    useGameStore.getState().placeDigit(4);

    // Notes should be cleared
    expect(useGameStore.getState().notes[row][col].size).toBe(0);
    // Value should be set
    expect(useGameStore.getState().currentBoard[row][col]).toBe(4);
  });

  it("notes render as a mini-grid in the cell", () => {
    const { row, col } = findEmptyCell();
    useGameStore.getState().selectCell(row, col);
    useGameStore.getState().toggleNotesMode();
    useGameStore.getState().placeDigit(2);
    useGameStore.getState().placeDigit(8);

    render(<Board />);

    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    expect(cell).not.toBeNull();
    const notesGrid = cell!.querySelector("[data-notes]");
    expect(notesGrid).not.toBeNull();

    // Digit 2 and 8 should be visible
    const note2 = notesGrid!.querySelector('[data-note-digit="2"]');
    const note8 = notesGrid!.querySelector('[data-note-digit="8"]');
    expect(note2!.textContent).toBe("2");
    expect(note8!.textContent).toBe("8");

    // Digit 5 should be empty
    const note5 = notesGrid!.querySelector('[data-note-digit="5"]');
    expect(note5!.textContent).toBe("");
  });

  it("erasing a cell also clears its notes", () => {
    const { row, col } = findEmptyCell();
    useGameStore.getState().selectCell(row, col);

    // Add notes
    useGameStore.getState().toggleNotesMode();
    useGameStore.getState().placeDigit(3);
    useGameStore.getState().placeDigit(6);
    expect(useGameStore.getState().notes[row][col].size).toBe(2);

    // Switch to pen mode and erase
    useGameStore.getState().toggleNotesMode();
    useGameStore.getState().erase();

    expect(useGameStore.getState().notes[row][col].size).toBe(0);
  });

  it("startGame resets notes and notesMode", () => {
    const { row, col } = findEmptyCell();
    useGameStore.getState().selectCell(row, col);
    useGameStore.getState().toggleNotesMode();
    useGameStore.getState().placeDigit(9);

    expect(useGameStore.getState().notesMode).toBe(true);
    expect(useGameStore.getState().notes[row][col].has(9)).toBe(true);

    // Start a new game
    useGameStore.getState().startGame(puzzle);

    expect(useGameStore.getState().notesMode).toBe(false);
    expect(useGameStore.getState().notes[row][col].size).toBe(0);
  });
});
