import { render, fireEvent, act } from "@testing-library/react";
import Board from "@/components/board/Board";
import { useGameStore } from "@/lib/store/gameStore";
import { createPuzzle } from "@/lib/sudoku/puzzle";

const puzzle = createPuzzle("keyboard-test-seed", "easy");

function initStore() {
  useGameStore.getState().startGame(puzzle);
}

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

function findClueCell(): { row: number; col: number } {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle.board[r][c] !== 0) {
        return { row: r, col: c };
      }
    }
  }
  throw new Error("No clue cell found");
}

beforeEach(() => {
  initStore();
});

describe("KeyboardInput", () => {
  it("pressing a digit key fills the selected cell", () => {
    const { row, col } = findEmptyCell();
    useGameStore.getState().selectCell(row, col);
    render(<Board />);

    fireEvent.keyDown(document, { key: "5" });

    expect(useGameStore.getState().currentBoard[row][col]).toBe(5);
  });

  it("pressing Backspace clears the selected cell", () => {
    const { row, col } = findEmptyCell();
    useGameStore.getState().selectCell(row, col);
    useGameStore.getState().placeDigit(7);
    expect(useGameStore.getState().currentBoard[row][col]).toBe(7);

    render(<Board />);

    fireEvent.keyDown(document, { key: "Backspace" });

    expect(useGameStore.getState().currentBoard[row][col]).toBe(0);
  });

  it("arrow keys move selection in correct direction", () => {
    // Pick a cell in the middle so all directions are valid
    const startRow = 4;
    const startCol = 4;
    useGameStore.getState().selectCell(startRow, startCol);
    render(<Board />);

    fireEvent.keyDown(document, { key: "ArrowUp" });
    expect(useGameStore.getState().selectedCell).toEqual({ row: 3, col: 4 });

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(useGameStore.getState().selectedCell).toEqual({ row: 4, col: 4 });

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(useGameStore.getState().selectedCell).toEqual({ row: 4, col: 3 });

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(useGameStore.getState().selectedCell).toEqual({ row: 4, col: 4 });
  });

  it("arrow keys clamp at board edges", () => {
    // Top-left corner
    useGameStore.getState().selectCell(0, 0);
    render(<Board />);

    fireEvent.keyDown(document, { key: "ArrowUp" });
    expect(useGameStore.getState().selectedCell).toEqual({ row: 0, col: 0 });

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(useGameStore.getState().selectedCell).toEqual({ row: 0, col: 0 });

    // Bottom-right corner
    act(() => {
      useGameStore.getState().selectCell(8, 8);
    });

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(useGameStore.getState().selectedCell).toEqual({ row: 8, col: 8 });

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(useGameStore.getState().selectedCell).toEqual({ row: 8, col: 8 });
  });

  it("keyboard input on a clue cell is ignored", () => {
    const { row, col } = findClueCell();
    const originalValue = puzzle.board[row][col];
    useGameStore.getState().selectCell(row, col);
    render(<Board />);

    fireEvent.keyDown(document, { key: "5" });

    expect(useGameStore.getState().currentBoard[row][col]).toBe(originalValue);
  });
});
