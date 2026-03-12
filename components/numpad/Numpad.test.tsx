import { render, fireEvent } from "@testing-library/react";
import Numpad from "@/components/numpad/Numpad";
import { useGameStore } from "@/lib/store/gameStore";
import { createPuzzle } from "@/lib/sudoku/puzzle";

const puzzle = createPuzzle("numpad-test-seed", "easy");

function initStore() {
  useGameStore.getState().startGame(puzzle);
}

function selectEmptyCell(): { row: number; col: number } {
  const board = puzzle.board;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        useGameStore.getState().selectCell(r, c);
        return { row: r, col: c };
      }
    }
  }
  throw new Error("No empty cell found");
}

beforeEach(() => {
  initStore();
});

describe("Numpad", () => {
  it("renders 9 digit buttons and an erase button", () => {
    const { container } = render(<Numpad />);
    const digitButtons = container.querySelectorAll("[data-digit]");
    expect(digitButtons).toHaveLength(9);

    for (let d = 1; d <= 9; d++) {
      expect(container.querySelector(`[data-digit="${d}"]`)).not.toBeNull();
    }

    const eraseButton = container.querySelector('[data-action="erase"]');
    expect(eraseButton).not.toBeNull();
    expect(eraseButton!.textContent).toBe("Erase");
  });

  it("clicking a digit dispatches correct action to game store", () => {
    const { row, col } = selectEmptyCell();
    const { container } = render(<Numpad />);

    const button5 = container.querySelector('[data-digit="5"]')!;
    fireEvent.click(button5);

    const board = useGameStore.getState().currentBoard;
    expect(board[row][col]).toBe(5);
  });

  it("clicking erase dispatches erase action", () => {
    const { row, col } = selectEmptyCell();

    // Place a digit first
    useGameStore.getState().placeDigit(7);
    expect(useGameStore.getState().currentBoard[row][col]).toBe(7);

    const { container } = render(<Numpad />);
    const eraseButton = container.querySelector('[data-action="erase"]')!;
    fireEvent.click(eraseButton);

    expect(useGameStore.getState().currentBoard[row][col]).toBe(0);
  });

  it("button for digit with 9 placements has disabled/grayed-out state", () => {
    // Fill the board so that digit 1 appears 9 times
    const state = useGameStore.getState();
    const board = state.currentBoard.map((r) => [...r]);

    // Count existing 1s
    let count = 0;
    for (const row of board) {
      for (const val of row) {
        if (val === 1) count++;
      }
    }

    // Place 1 in empty cells until we reach 9
    for (let r = 0; r < 9 && count < 9; r++) {
      for (let c = 0; c < 9 && count < 9; c++) {
        if (board[r][c] === 0) {
          board[r][c] = 1;
          count++;
        }
      }
    }

    // Set the board directly
    useGameStore.setState({ currentBoard: board });

    const { container } = render(<Numpad />);
    const button1 = container.querySelector('[data-digit="1"]') as HTMLButtonElement;
    expect(button1.disabled).toBe(true);

    // Other digits should not be disabled (unless they also have 9)
    const button9 = container.querySelector('[data-digit="9"]') as HTMLButtonElement;
    // button9 may or may not be disabled depending on puzzle, just check button1 is disabled
    expect(button1.className).toContain("cursor-not-allowed");
  });
});
