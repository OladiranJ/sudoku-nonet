import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

jest.mock("canvas-confetti", () => jest.fn());

// Mock the game store to provide a puzzle so the page renders
jest.mock("@/lib/store/gameStore", () => {
  const { createPuzzle } = jest.requireActual("@/lib/sudoku/puzzle");
  const puzzle = createPuzzle("test-seed", "easy");

  // Build a minimal board from the puzzle
  const currentBoard = puzzle.board.map((row: number[]) => [...row]);
  const notes = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );

  const store = {
    puzzle,
    currentBoard,
    difficulty: "easy",
    isComplete: false,
    isDaily: false,
    selectedCell: null,
    notes,
    notesMode: false,
    errorCount: 0,
    hintCount: 0,
    undoStack: [],
    redoStack: [],
    selectCell: jest.fn(),
    placeDigit: jest.fn(),
    erase: jest.fn(),
    toggleNotesMode: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    useHint: jest.fn(),
    startGame: jest.fn(),
  };

  return {
    useGameStore: (selector: (s: typeof store) => unknown) => selector(store),
    getDigitCounts: jest.fn(() => {
      const counts: Record<number, number> = {};
      for (let d = 1; d <= 9; d++) counts[d] = 0;
      return counts;
    }),
  };
});

jest.mock("@/lib/store/timerStore", () => {
  const store = {
    elapsed: 0,
    isPaused: false,
    isRunning: true,
    pause: jest.fn(),
    resume: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  };
  return {
    useTimerStore: Object.assign(
      (selector: (s: typeof store) => unknown) => selector(store),
      { getState: () => store }
    ),
  };
});

describe("Page layout", () => {
  it("renders Header with wordmark and icon buttons", () => {
    render(<Home />);

    const header = screen.getByTestId("header");
    expect(header).toBeInTheDocument();

    const wordmark = screen.getByTestId("wordmark");
    expect(wordmark).toHaveTextContent("Nonet");

    expect(screen.getByTestId("nav-stats")).toBeInTheDocument();
    expect(screen.getByTestId("nav-notifications")).toBeInTheDocument();
    expect(screen.getByTestId("nav-theme")).toBeInTheDocument();
    expect(screen.getByTestId("nav-profile")).toBeInTheDocument();
  });

  it("desktop viewport: layout container has md:flex-row for side-by-side", () => {
    render(<Home />);

    const container = screen.getByTestId("layout-container");
    expect(container.className).toContain("flex-col");
    expect(container.className).toContain("md:flex-row");
  });

  it("mobile viewport: board appears before controls in DOM order", () => {
    render(<Home />);

    const boardSection = screen.getByTestId("board-section");
    const controlsPanel = screen.getByTestId("controls-panel");

    // Board should come before controls in the document
    const comparison = boardSection.compareDocumentPosition(controlsPanel);
    // DOCUMENT_POSITION_FOLLOWING = 4
    expect(comparison & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders GameInfo with timer and error counter", () => {
    render(<Home />);

    // GameInfo renders twice (mobile + desktop), so use getAllBy
    const timers = screen.getAllByTestId("timer");
    expect(timers.length).toBeGreaterThanOrEqual(1);

    const errors = screen.getAllByTestId("error-counter");
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it("renders difficulty badge in GameInfo", () => {
    render(<Home />);

    const badges = screen.getAllByTestId("difficulty-badge");
    expect(badges.length).toBeGreaterThanOrEqual(1);
    expect(badges[0]).toHaveTextContent("easy");
  });

  it("renders undo and redo buttons", () => {
    render(<Home />);

    const undos = screen.getAllByTestId("undo-button");
    expect(undos.length).toBeGreaterThanOrEqual(1);

    const redos = screen.getAllByTestId("redo-button");
    expect(redos.length).toBeGreaterThanOrEqual(1);
  });

  it("renders board and controls panel", () => {
    render(<Home />);

    expect(screen.getByRole("grid", { name: "Sudoku board" })).toBeInTheDocument();
    expect(screen.getByTestId("controls-panel")).toBeInTheDocument();
  });
});
