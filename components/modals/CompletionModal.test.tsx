import { render, fireEvent } from "@testing-library/react";

// Mock canvas-confetti
jest.mock("canvas-confetti", () => jest.fn());

// Mock tRPC client (ChallengeButton uses follow.getFollowing)
jest.mock("@/lib/trpc/client", () => ({
  trpc: {
    follow: {
      getFollowing: {
        useQuery: (_input: unknown, _opts: unknown) => ({ data: [] }),
      },
    },
    challenge: {
      create: {
        useMutation: () => ({ mutate: jest.fn(), isPending: false }),
      },
    },
  },
}));

import CompletionModal from "@/components/modals/CompletionModal";
import { useGameStore } from "@/lib/store/gameStore";
import { useTimerStore } from "@/lib/store/timerStore";
import { createPuzzle } from "@/lib/sudoku/puzzle";

const easyPuzzle = createPuzzle("completion-test-seed", "easy");

beforeEach(() => {
  useGameStore.getState().startGame(easyPuzzle, {
    seed: "completion-test-seed",
    isDaily: false,
  });
  useTimerStore.getState().reset();
});

describe("CompletionModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <CompletionModal
        isOpen={false}
        onClose={jest.fn()}
        onPlayAgain={jest.fn()}
        onNewGame={jest.fn()}
      />
    );
    expect(container.querySelector('[data-testid="completion-modal"]')).toBeNull();
  });

  it("renders modal when isOpen is true", () => {
    const { container } = render(
      <CompletionModal
        isOpen={true}
        onClose={jest.fn()}
        onPlayAgain={jest.fn()}
        onNewGame={jest.fn()}
      />
    );
    expect(container.querySelector('[data-testid="completion-modal"]')).not.toBeNull();
  });

  it("displays correct time, difficulty, error count, and hint count", () => {
    // Set up some state
    useTimerStore.getState().setElapsed(272); // 4:32
    // Simulate 3 errors and 2 hints
    useGameStore.setState({ errorCount: 3, hintCount: 2 });

    const { container } = render(
      <CompletionModal
        isOpen={true}
        onClose={jest.fn()}
        onPlayAgain={jest.fn()}
        onNewGame={jest.fn()}
      />
    );

    expect(container.querySelector('[data-testid="stat-time"]')!.textContent).toBe("04:32");
    expect(container.querySelector('[data-testid="stat-difficulty"]')!.textContent).toBe("Easy");
    expect(container.querySelector('[data-testid="stat-errors"]')!.textContent).toBe("3");
    expect(container.querySelector('[data-testid="stat-hints"]')!.textContent).toBe("2");
  });

  it("calls onPlayAgain when 'Play Again' is clicked", () => {
    const onPlayAgain = jest.fn();
    const { container } = render(
      <CompletionModal
        isOpen={true}
        onClose={jest.fn()}
        onPlayAgain={onPlayAgain}
        onNewGame={jest.fn()}
      />
    );

    fireEvent.click(container.querySelector('[data-action="play-again"]')!);
    expect(onPlayAgain).toHaveBeenCalled();
  });

  it("calls onNewGame when 'New Game' is clicked", () => {
    const onNewGame = jest.fn();
    const { container } = render(
      <CompletionModal
        isOpen={true}
        onClose={jest.fn()}
        onPlayAgain={jest.fn()}
        onNewGame={onNewGame}
      />
    );

    fireEvent.click(container.querySelector('[data-action="new-game"]')!);
    expect(onNewGame).toHaveBeenCalled();
  });

  it("shows 'Random' badge for random puzzles", () => {
    useGameStore.setState({ isDaily: false });

    const { container } = render(
      <CompletionModal
        isOpen={true}
        onClose={jest.fn()}
        onPlayAgain={jest.fn()}
        onNewGame={jest.fn()}
      />
    );

    const badge = container.querySelector('[data-testid="puzzle-badge"]');
    expect(badge!.textContent).toBe("Random");
  });

  it("shows 'Daily' badge for daily puzzles", () => {
    useGameStore.setState({ isDaily: true });

    const { container } = render(
      <CompletionModal
        isOpen={true}
        onClose={jest.fn()}
        onPlayAgain={jest.fn()}
        onNewGame={jest.fn()}
      />
    );

    const badge = container.querySelector('[data-testid="puzzle-badge"]');
    expect(badge!.textContent).toBe("Daily");
  });

  it("shows account prompt for guests", () => {
    const { container } = render(
      <CompletionModal
        isOpen={true}
        isGuest={true}
        onClose={jest.fn()}
        onPlayAgain={jest.fn()}
        onNewGame={jest.fn()}
      />
    );

    const cta = container.querySelector('[data-testid="guest-cta"]');
    expect(cta).not.toBeNull();
    expect(cta!.textContent).toContain("Save your stats");
    expect(cta!.textContent).toContain("create a free account");
  });

  it("does not show account prompt for authenticated users", () => {
    const { container } = render(
      <CompletionModal
        isOpen={true}
        isGuest={false}
        onClose={jest.fn()}
        onPlayAgain={jest.fn()}
        onNewGame={jest.fn()}
      />
    );

    const cta = container.querySelector('[data-testid="guest-cta"]');
    expect(cta).toBeNull();
  });
});
