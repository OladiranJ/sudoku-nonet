import { render, fireEvent } from "@testing-library/react";
import NewGameModal from "@/components/modals/NewGameModal";
import { useGameStore } from "@/lib/store/gameStore";
import { useTimerStore } from "@/lib/store/timerStore";
import { useDailyStore } from "@/lib/store/dailyStore";
import { createPuzzle } from "@/lib/sudoku/puzzle";
import * as autoSave from "@/lib/store/autoSave";
import * as dailyModule from "@/lib/sudoku/daily";

// Pre-generate a puzzle for the store so auto-save has something to save
const demoPuzzle = createPuzzle("modal-test-seed", "easy");

beforeEach(() => {
  // Initialize store with a game in progress
  useGameStore.getState().startGame(demoPuzzle, { seed: "modal-test-seed" });
  useTimerStore.getState().reset();
  useDailyStore.setState({ completions: [] });
});

describe("NewGameModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <NewGameModal isOpen={false} onClose={jest.fn()} />
    );
    expect(container.querySelector('[data-testid="new-game-modal"]')).toBeNull();
  });

  it("renders modal when isOpen is true", () => {
    const { container } = render(
      <NewGameModal isOpen={true} onClose={jest.fn()} />
    );
    expect(
      container.querySelector('[data-testid="new-game-modal"]')
    ).not.toBeNull();
  });

  it("renders all 4 difficulty options in step 1", () => {
    const { container } = render(
      <NewGameModal isOpen={true} onClose={jest.fn()} />
    );
    const difficulties = ["easy", "medium", "hard", "expert"];
    for (const d of difficulties) {
      expect(
        container.querySelector(`[data-difficulty="${d}"]`)
      ).not.toBeNull();
    }
  });

  it("shows puzzle type step after selecting a difficulty", () => {
    const { container } = render(
      <NewGameModal isOpen={true} onClose={jest.fn()} />
    );

    // Step 1 should be visible
    expect(
      container.querySelector('[data-testid="step-difficulty"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="step-puzzle-type"]')
    ).toBeNull();

    // Select "Hard" difficulty
    fireEvent.click(container.querySelector('[data-difficulty="hard"]')!);

    // Step 2 should now be visible
    expect(
      container.querySelector('[data-testid="step-difficulty"]')
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="step-puzzle-type"]')
    ).not.toBeNull();
  });

  it("starts a random puzzle game with a random seed on 'Random Puzzle' click", () => {
    const startGameSpy = jest.spyOn(useGameStore.getState(), "startGame");
    // Re-bind spy since Zustand recreates the function reference
    const originalStartGame = useGameStore.getState().startGame;
    const mockStartGame = jest.fn(originalStartGame);
    useGameStore.setState({ startGame: mockStartGame });

    const timerStartSpy = jest.fn(useTimerStore.getState().start);
    useTimerStore.setState({ start: timerStartSpy });

    const onClose = jest.fn();
    const { container } = render(
      <NewGameModal isOpen={true} onClose={onClose} />
    );

    // Select difficulty
    fireEvent.click(container.querySelector('[data-difficulty="medium"]')!);
    // Select Random Puzzle
    fireEvent.click(container.querySelector('[data-puzzle-type="random"]')!);

    // Verify game was started
    expect(mockStartGame).toHaveBeenCalledTimes(1);
    const [puzzle, options] = mockStartGame.mock.calls[0];
    expect(puzzle.difficulty).toBe("medium");
    expect(options.isDaily).toBe(false);
    expect(options.seed).toBeDefined();
    expect(typeof options.seed).toBe("string");
    expect(options.seed.length).toBeGreaterThan(0);

    // Timer should have started
    expect(timerStartSpy).toHaveBeenCalled();

    // Modal should close
    expect(onClose).toHaveBeenCalled();

    startGameSpy.mockRestore();
  });

  it("starts a daily puzzle game with a date-based seed on 'Daily Puzzle' click", () => {
    const originalStartGame = useGameStore.getState().startGame;
    const mockStartGame = jest.fn(originalStartGame);
    useGameStore.setState({ startGame: mockStartGame });

    const timerStartSpy = jest.fn(useTimerStore.getState().start);
    useTimerStore.setState({ start: timerStartSpy });

    const getDailySeedSpy = jest.spyOn(dailyModule, "getDailySeed");

    const onClose = jest.fn();
    const { container } = render(
      <NewGameModal isOpen={true} onClose={onClose} />
    );

    // Select difficulty
    fireEvent.click(container.querySelector('[data-difficulty="expert"]')!);
    // Select Daily Puzzle
    fireEvent.click(container.querySelector('[data-puzzle-type="daily"]')!);

    // Verify getDailySeed was called with today's date and selected difficulty
    expect(getDailySeedSpy).toHaveBeenCalledWith(
      new Date().toISOString().split("T")[0],
      "expert"
    );

    // Verify game was started with daily options
    expect(mockStartGame).toHaveBeenCalledTimes(1);
    const [puzzle, options] = mockStartGame.mock.calls[0];
    expect(puzzle.difficulty).toBe("expert");
    expect(options.isDaily).toBe(true);
    expect(options.puzzleDate).toBe(new Date().toISOString().split("T")[0]);

    // Timer should have started
    expect(timerStartSpy).toHaveBeenCalled();

    // Modal should close
    expect(onClose).toHaveBeenCalled();

    getDailySeedSpy.mockRestore();
  });

  it("closes modal when close button is clicked", () => {
    const onClose = jest.fn();
    const { container } = render(
      <NewGameModal isOpen={true} onClose={onClose} />
    );

    const closeBtn = container.querySelector('[aria-label="Close"]');
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn!);

    expect(onClose).toHaveBeenCalled();
  });

  it("auto-saves in-progress game before starting a new one", () => {
    const saveSpy = jest.spyOn(autoSave, "saveGameState");

    const { container } = render(
      <NewGameModal isOpen={true} onClose={jest.fn()} />
    );

    // Select difficulty and start a random game
    fireEvent.click(container.querySelector('[data-difficulty="easy"]')!);
    fireEvent.click(container.querySelector('[data-puzzle-type="random"]')!);

    expect(saveSpy).toHaveBeenCalled();
    saveSpy.mockRestore();
  });

  it("back button returns to step 1 from step 2", () => {
    const { container } = render(
      <NewGameModal isOpen={true} onClose={jest.fn()} />
    );

    // Go to step 2
    fireEvent.click(container.querySelector('[data-difficulty="hard"]')!);
    expect(
      container.querySelector('[data-testid="step-puzzle-type"]')
    ).not.toBeNull();

    // Click back
    fireEvent.click(container.querySelector('[data-action="back"]')!);
    expect(
      container.querySelector('[data-testid="step-difficulty"]')
    ).not.toBeNull();
  });

  it("resets to step 1 when modal re-opens", () => {
    const { container, rerender } = render(
      <NewGameModal isOpen={true} onClose={jest.fn()} />
    );

    // Go to step 2
    fireEvent.click(container.querySelector('[data-difficulty="hard"]')!);
    expect(
      container.querySelector('[data-testid="step-puzzle-type"]')
    ).not.toBeNull();

    // Close and reopen
    rerender(<NewGameModal isOpen={false} onClose={jest.fn()} />);
    rerender(<NewGameModal isOpen={true} onClose={jest.fn()} />);

    // Should be back at step 1
    expect(
      container.querySelector('[data-testid="step-difficulty"]')
    ).not.toBeNull();
  });

  it("shows completed daily difficulty as locked/disabled in modal", () => {
    const today = new Date().toISOString().split("T")[0];
    useDailyStore.getState().markCompleted("hard", today, 272);

    const { container } = render(
      <NewGameModal isOpen={true} onClose={jest.fn()} />
    );

    // Select the completed difficulty
    fireEvent.click(container.querySelector('[data-difficulty="hard"]')!);

    // Daily button should be disabled
    const dailyBtn = container.querySelector('[data-puzzle-type="daily"]') as HTMLButtonElement;
    expect(dailyBtn).not.toBeNull();
    expect(dailyBtn.disabled).toBe(true);

    // Should show locked state with completion time
    const locked = container.querySelector('[data-testid="daily-locked"]');
    expect(locked).not.toBeNull();
    expect(locked!.textContent).toContain("04:32");

    // Should show countdown
    const countdown = container.querySelector('[data-testid="daily-countdown"]');
    expect(countdown).not.toBeNull();
    expect(countdown!.textContent).toMatch(/Next daily in/);
  });

  it("shows normal Daily Puzzle button for uncompleted difficulty", () => {
    const today = new Date().toISOString().split("T")[0];
    // Mark easy as completed, but not medium
    useDailyStore.getState().markCompleted("easy", today, 100);

    const { container } = render(
      <NewGameModal isOpen={true} onClose={jest.fn()} />
    );

    // Select medium (not completed)
    fireEvent.click(container.querySelector('[data-difficulty="medium"]')!);

    const dailyBtn = container.querySelector('[data-puzzle-type="daily"]') as HTMLButtonElement;
    expect(dailyBtn.disabled).toBe(false);
    expect(container.querySelector('[data-testid="daily-locked"]')).toBeNull();
  });

  it("prevents starting a locked daily puzzle", () => {
    const today = new Date().toISOString().split("T")[0];
    useDailyStore.getState().markCompleted("expert", today, 500);

    const originalStartGame = useGameStore.getState().startGame;
    const mockStartGame = jest.fn(originalStartGame);
    useGameStore.setState({ startGame: mockStartGame });

    const { container } = render(
      <NewGameModal isOpen={true} onClose={jest.fn()} />
    );

    fireEvent.click(container.querySelector('[data-difficulty="expert"]')!);
    fireEvent.click(container.querySelector('[data-puzzle-type="daily"]')!);

    // Should not start a game since it's locked
    expect(mockStartGame).not.toHaveBeenCalled();
  });
});
