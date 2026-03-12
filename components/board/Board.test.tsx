import { render, screen } from "@testing-library/react";
import Board from "@/components/board/Board";
import { createPuzzle } from "@/lib/sudoku/puzzle";

const puzzle = createPuzzle("test-seed", "easy");

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

  it("3x3 sub-grid borders are visually distinct", () => {
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
});
