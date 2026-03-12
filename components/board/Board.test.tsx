import { render, screen, fireEvent } from "@testing-library/react";
import Board from "@/components/board/Board";
import { createPuzzle } from "@/lib/sudoku/puzzle";

const puzzle = createPuzzle("test-seed", "easy");

// Helper: deep-copy a 2D array
function cloneBoard(board: number[][]): number[][] {
  return board.map((row) => [...row]);
}

describe("Board", () => {
  it("renders 81 cells", () => {
    const { container } = render(<Board puzzle={puzzle} />);
    const cells = container.querySelectorAll("[data-cell]");
    expect(cells).toHaveLength(81);
  });

  it("clue cells have data-clue='true' and are non-editable", () => {
    const { container } = render(<Board puzzle={puzzle} />);
    const clueCells = container.querySelectorAll('[data-clue="true"]');

    expect(clueCells.length).toBe(puzzle.clueCount);

    clueCells.forEach((cell) => {
      expect(cell).toHaveAttribute("aria-readonly", "true");
      expect(cell.textContent).not.toBe("");
    });
  });

  it("player cells have data-clue='false' and are editable", () => {
    const { container } = render(<Board puzzle={puzzle} />);
    const playerCells = container.querySelectorAll('[data-clue="false"]');

    expect(playerCells.length).toBe(81 - puzzle.clueCount);

    playerCells.forEach((cell) => {
      expect(cell).not.toHaveAttribute("aria-readonly");
      expect(cell.textContent).toBe("");
    });
  });

  it("3×3 sub-grid borders are visually distinct", () => {
    const { container } = render(<Board puzzle={puzzle} />);
    const cells = container.querySelectorAll("[data-cell]");

    // Cell at row=0, col=0 should have thick top and thick left borders
    const topLeft = container.querySelector('[data-row="0"][data-col="0"]');
    expect(topLeft?.className).toContain("border-t-2");
    expect(topLeft?.className).toContain("border-l-2");

    // Cell at row=0, col=1 should have thick top but thin left
    const topSecond = container.querySelector('[data-row="0"][data-col="1"]');
    expect(topSecond?.className).toContain("border-t-2");
    expect(topSecond?.className).not.toContain("border-l-2");
    expect(topSecond?.className).toContain("border-l");

    // Cell at row=3, col=0 should have thick top (start of second box row)
    const secondBoxRow = container.querySelector('[data-row="3"][data-col="0"]');
    expect(secondBoxRow?.className).toContain("border-t-2");

    // Cell at row=1, col=3 should have thick left (start of second box col)
    const secondBoxCol = container.querySelector('[data-row="1"][data-col="3"]');
    expect(secondBoxCol?.className).toContain("border-l-2");

    // Cell at row=8, col=8 should have thick bottom and thick right
    const bottomRight = container.querySelector('[data-row="8"][data-col="8"]');
    expect(bottomRight?.className).toContain("border-b-2");
    expect(bottomRight?.className).toContain("border-r-2");

    // Cell at row=2, col=4 should have thin borders (interior, not on box boundary)
    const interior = container.querySelector('[data-row="2"][data-col="4"]');
    expect(interior?.className).not.toContain("border-t-2");
    expect(interior?.className).not.toContain("border-l-2");
    expect(interior?.className).toContain("border-t");
    expect(interior?.className).toContain("border-l");
  });

  // --- 2.2 Cell selection & highlighting ---

  it("clicking a cell sets it as selected (aria-selected)", () => {
    const { container } = render(<Board puzzle={puzzle} />);
    const cell = container.querySelector('[data-row="4"][data-col="4"]')!;
    fireEvent.click(cell);
    expect(cell).toHaveAttribute("aria-selected", "true");
  });

  it("peer cells (same row/col/box) get highlight class", () => {
    const { container } = render(<Board puzzle={puzzle} />);
    const cell = container.querySelector('[data-row="4"][data-col="4"]')!;
    fireEvent.click(cell);

    // Same row peer
    const sameRow = container.querySelector('[data-row="4"][data-col="0"]')!;
    expect(sameRow.className).toContain("cell-peer");

    // Same col peer
    const sameCol = container.querySelector('[data-row="0"][data-col="4"]')!;
    expect(sameCol.className).toContain("cell-peer");

    // Same 3x3 box peer (box starting at row=3, col=3)
    const sameBox = container.querySelector('[data-row="3"][data-col="3"]')!;
    expect(sameBox.className).toContain("cell-peer");

    // Non-peer cell should not have peer class
    const nonPeer = container.querySelector('[data-row="0"][data-col="0"]')!;
    expect(nonPeer.className).not.toContain("cell-peer");
  });

  it("cells with matching digit get same-number highlight class", () => {
    const { container } = render(<Board puzzle={puzzle} />);
    // Find a clue cell to click
    const clueCells = container.querySelectorAll('[data-clue="true"]');
    const clickedClue = clueCells[0] as HTMLElement;
    const clickedValue = clickedClue.textContent;
    fireEvent.click(clickedClue);

    // Find other clue cells with the same value (not the clicked one)
    const allCells = container.querySelectorAll("[data-cell]");
    let foundSameNumber = false;
    allCells.forEach((cell) => {
      if (cell === clickedClue) return;
      if (cell.textContent === clickedValue && clickedValue !== "") {
        expect(cell.className).toContain("cell-same-number");
        foundSameNumber = true;
      }
    });
    // Sudoku always has multiple instances of at least some digits
    expect(foundSameNumber).toBe(true);
  });

  it("selecting an empty cell does not trigger same-number highlight", () => {
    const { container } = render(<Board puzzle={puzzle} />);
    // Find an empty (player) cell
    const emptyCell = container.querySelector('[data-clue="false"]')!;
    fireEvent.click(emptyCell);

    // No cell should have same-number highlight
    const allCells = container.querySelectorAll("[data-cell]");
    allCells.forEach((cell) => {
      expect(cell.className).not.toContain("cell-same-number");
    });
  });

  // --- 2.3 Conflict highlighting ---

  it("entering a duplicate digit in a row marks both cells as conflicting", () => {
    // Find an empty cell and place a digit that already exists in its row
    const board = cloneBoard(puzzle.board);
    // Find first empty cell and a clue value in the same row
    let emptyRow = -1, emptyCol = -1, dupeValue = 0;
    outer: for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          // Find a non-zero value elsewhere in this row
          for (let cc = 0; cc < 9; cc++) {
            if (board[r][cc] !== 0 && cc !== c) {
              emptyRow = r;
              emptyCol = c;
              dupeValue = board[r][cc];
              break outer;
            }
          }
        }
      }
    }
    board[emptyRow][emptyCol] = dupeValue;

    const { container } = render(<Board puzzle={puzzle} currentBoard={board} />);
    const cell = container.querySelector(`[data-row="${emptyRow}"][data-col="${emptyCol}"]`)!;
    expect(cell.className).toContain("cell-conflict");
    expect(cell).toHaveAttribute("data-conflict", "true");
  });

  it("entering a duplicate digit in a column marks both cells as conflicting", () => {
    const board = cloneBoard(puzzle.board);
    let emptyRow = -1, emptyCol = -1, dupeValue = 0;
    outer: for (let c = 0; c < 9; c++) {
      for (let r = 0; r < 9; r++) {
        if (board[r][c] === 0) {
          for (let rr = 0; rr < 9; rr++) {
            if (board[rr][c] !== 0 && rr !== r) {
              emptyRow = r;
              emptyCol = c;
              dupeValue = board[rr][c];
              break outer;
            }
          }
        }
      }
    }
    board[emptyRow][emptyCol] = dupeValue;

    const { container } = render(<Board puzzle={puzzle} currentBoard={board} />);
    const cell = container.querySelector(`[data-row="${emptyRow}"][data-col="${emptyCol}"]`)!;
    expect(cell.className).toContain("cell-conflict");
    expect(cell).toHaveAttribute("data-conflict", "true");
  });

  it("entering a duplicate digit in a box marks both cells as conflicting", () => {
    const board = cloneBoard(puzzle.board);
    let emptyRow = -1, emptyCol = -1, dupeValue = 0;
    outer: for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        for (let r = br * 3; r < br * 3 + 3; r++) {
          for (let c = bc * 3; c < bc * 3 + 3; c++) {
            if (board[r][c] === 0) {
              // Find a clue in the same box
              for (let rr = br * 3; rr < br * 3 + 3; rr++) {
                for (let cc = bc * 3; cc < bc * 3 + 3; cc++) {
                  if (board[rr][cc] !== 0 && (rr !== r || cc !== c)) {
                    emptyRow = r;
                    emptyCol = c;
                    dupeValue = board[rr][cc];
                    break outer;
                  }
                }
              }
            }
          }
        }
      }
    }
    board[emptyRow][emptyCol] = dupeValue;

    const { container } = render(<Board puzzle={puzzle} currentBoard={board} />);
    const cell = container.querySelector(`[data-row="${emptyRow}"][data-col="${emptyCol}"]`)!;
    expect(cell.className).toContain("cell-conflict");
    expect(cell).toHaveAttribute("data-conflict", "true");
  });

  it("removing the duplicate clears the conflict highlight", () => {
    const board = cloneBoard(puzzle.board);
    // Place a conflict then remove it
    let emptyRow = -1, emptyCol = -1, dupeValue = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let cc = 0; cc < 9; cc++) {
            if (board[r][cc] !== 0 && cc !== c) {
              emptyRow = r;
              emptyCol = c;
              dupeValue = board[r][cc];
              break;
            }
          }
          if (emptyRow >= 0) break;
        }
      }
      if (emptyRow >= 0) break;
    }

    // First render WITH conflict
    board[emptyRow][emptyCol] = dupeValue;
    const { container, rerender } = render(<Board puzzle={puzzle} currentBoard={board} />);
    const cell = container.querySelector(`[data-row="${emptyRow}"][data-col="${emptyCol}"]`)!;
    expect(cell.className).toContain("cell-conflict");

    // Now remove the duplicate (set back to 0) and re-render
    const clearedBoard = cloneBoard(board);
    clearedBoard[emptyRow][emptyCol] = 0;
    rerender(<Board puzzle={puzzle} currentBoard={clearedBoard} />);

    const cellAfter = container.querySelector(`[data-row="${emptyRow}"][data-col="${emptyCol}"]`)!;
    expect(cellAfter.className).not.toContain("cell-conflict");
    expect(cellAfter).not.toHaveAttribute("data-conflict");
  });
});
