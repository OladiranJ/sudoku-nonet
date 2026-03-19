import { useGuestStore } from "@/lib/store/guestStore";
import { useGameStore } from "@/lib/store/gameStore";
import { useTimerStore } from "@/lib/store/timerStore";
import { createPuzzle } from "@/lib/sudoku/puzzle";
import type { Puzzle } from "@/lib/sudoku/puzzle";

const getGuestState = () => useGuestStore.getState();

function makeTestPuzzle(): Puzzle {
  return createPuzzle("guest-test-seed", "easy");
}

describe("guestStore — Task 9.4", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset guest store to initial state
    useGuestStore.setState({
      solvedCount: 0,
      bestTimes: { easy: null, medium: null, hard: null, expert: null },
      games: [],
    });
  });

  test("guest game state saves to localStorage", () => {
    getGuestState().recordGame("easy", 120, 1, 0);

    const raw = localStorage.getItem("nonet:guest-stats");
    expect(raw).not.toBeNull();

    const data = JSON.parse(raw!);
    expect(data.solvedCount).toBe(1);
    expect(data.games).toHaveLength(1);
    expect(data.games[0].difficulty).toBe("easy");
    expect(data.games[0].timeSeconds).toBe(120);
    expect(data.games[0].errorCount).toBe(1);
    expect(data.games[0].hintCount).toBe(0);
  });

  test("guest stats (solved count, best time) accumulate in localStorage", () => {
    getGuestState().recordGame("easy", 200, 2, 1);
    getGuestState().recordGame("easy", 150, 0, 0);
    getGuestState().recordGame("hard", 300, 1, 2);

    expect(getGuestState().solvedCount).toBe(3);
    expect(getGuestState().bestTimes.easy).toBe(150);
    expect(getGuestState().bestTimes.hard).toBe(300);
    expect(getGuestState().bestTimes.medium).toBeNull();
    expect(getGuestState().bestTimes.expert).toBeNull();
    expect(getGuestState().games).toHaveLength(3);

    // Verify localStorage has accumulated data
    const raw = localStorage.getItem("nonet:guest-stats");
    const data = JSON.parse(raw!);
    expect(data.solvedCount).toBe(3);
    expect(data.bestTimes.easy).toBe(150);
  });

  test("hydrate restores stats from localStorage", () => {
    // Record some games
    getGuestState().recordGame("medium", 180, 0, 0);
    getGuestState().recordGame("medium", 160, 1, 0);

    // Reset store state (simulating page reload)
    useGuestStore.setState({
      solvedCount: 0,
      bestTimes: { easy: null, medium: null, hard: null, expert: null },
      games: [],
    });
    expect(getGuestState().solvedCount).toBe(0);

    // Hydrate from localStorage
    getGuestState().hydrate();

    expect(getGuestState().solvedCount).toBe(2);
    expect(getGuestState().bestTimes.medium).toBe(160);
    expect(getGuestState().games).toHaveLength(2);
  });

  test("best time updates only when new time is lower", () => {
    getGuestState().recordGame("expert", 600, 0, 0);
    expect(getGuestState().bestTimes.expert).toBe(600);

    getGuestState().recordGame("expert", 700, 0, 0);
    expect(getGuestState().bestTimes.expert).toBe(600); // unchanged

    getGuestState().recordGame("expert", 500, 0, 0);
    expect(getGuestState().bestTimes.expert).toBe(500); // updated
  });

  test("no API call is made to save guest game results", () => {
    // Install a fetch mock to detect any network calls
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;

    const puzzle = makeTestPuzzle();
    useGameStore.getState().startGame(puzzle, { seed: "guest-test-seed" });
    useTimerStore.getState().setElapsed(100);

    // Record a guest game — should only use localStorage, no fetch
    getGuestState().recordGame("easy", 100, 0, 0);

    expect(fetchMock).not.toHaveBeenCalled();

    // Verify data went to localStorage instead
    const raw = localStorage.getItem("nonet:guest-stats");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).solvedCount).toBe(1);

    // Clean up
    delete (globalThis as Record<string, unknown>).fetch;
  });
});
