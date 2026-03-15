import { useDailyStore, formatTime, getTimeUntilMidnight } from "@/lib/store/dailyStore";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  useDailyStore.setState({ completions: [] });
});

describe("dailyStore", () => {
  it("isDailyCompleted returns false when no completion exists", () => {
    expect(useDailyStore.getState().isDailyCompleted("easy", "2026-03-14")).toBe(false);
  });

  it("isDailyCompleted returns true after marking a daily puzzle complete", () => {
    useDailyStore.getState().markCompleted("easy", "2026-03-14", 245);
    expect(useDailyStore.getState().isDailyCompleted("easy", "2026-03-14")).toBe(true);
  });

  it("getCompletionTime returns the correct time after completion", () => {
    useDailyStore.getState().markCompleted("hard", "2026-03-14", 372);
    expect(useDailyStore.getState().getCompletionTime("hard", "2026-03-14")).toBe(372);
  });

  it("getCompletionTime returns null for uncompleted difficulty", () => {
    expect(useDailyStore.getState().getCompletionTime("hard", "2026-03-14")).toBeNull();
  });

  it("does not add duplicate completions", () => {
    useDailyStore.getState().markCompleted("easy", "2026-03-14", 200);
    useDailyStore.getState().markCompleted("easy", "2026-03-14", 300);
    expect(useDailyStore.getState().completions).toHaveLength(1);
    expect(useDailyStore.getState().completions[0].timeSeconds).toBe(200);
  });

  it("tracks different difficulties independently", () => {
    useDailyStore.getState().markCompleted("easy", "2026-03-14", 100);
    useDailyStore.getState().markCompleted("hard", "2026-03-14", 500);
    expect(useDailyStore.getState().isDailyCompleted("easy", "2026-03-14")).toBe(true);
    expect(useDailyStore.getState().isDailyCompleted("hard", "2026-03-14")).toBe(true);
    expect(useDailyStore.getState().isDailyCompleted("medium", "2026-03-14")).toBe(false);
  });

  it("lockout resets when the date changes", () => {
    useDailyStore.getState().markCompleted("easy", "2026-03-14", 200);
    expect(useDailyStore.getState().isDailyCompleted("easy", "2026-03-14")).toBe(true);
    expect(useDailyStore.getState().isDailyCompleted("easy", "2026-03-15")).toBe(false);
  });

  it("guest daily completions are tracked in localStorage", () => {
    useDailyStore.getState().markCompleted("medium", "2026-03-14", 300);
    const stored = localStorageMock.getItem("nonet:daily-completions");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({
      difficulty: "medium",
      date: "2026-03-14",
      timeSeconds: 300,
    });
  });

  it("hydrate restores completions from localStorage", () => {
    localStorageMock.setItem(
      "nonet:daily-completions",
      JSON.stringify([{ difficulty: "expert", date: "2026-03-14", timeSeconds: 600 }])
    );
    useDailyStore.getState().hydrate();
    expect(useDailyStore.getState().isDailyCompleted("expert", "2026-03-14")).toBe(true);
    expect(useDailyStore.getState().getCompletionTime("expert", "2026-03-14")).toBe(600);
  });

  it("clearExpired removes entries older than today", () => {
    useDailyStore.setState({
      completions: [
        { difficulty: "easy", date: "2026-03-12", timeSeconds: 100 },
        { difficulty: "hard", date: "2026-03-13", timeSeconds: 200 },
        { difficulty: "medium", date: "2026-03-14", timeSeconds: 300 },
      ],
    });
    useDailyStore.getState().clearExpired("2026-03-14");
    expect(useDailyStore.getState().completions).toHaveLength(1);
    expect(useDailyStore.getState().completions[0].date).toBe("2026-03-14");
  });

  it("clearExpired persists cleaned data to localStorage", () => {
    useDailyStore.setState({
      completions: [
        { difficulty: "easy", date: "2026-03-12", timeSeconds: 100 },
        { difficulty: "medium", date: "2026-03-14", timeSeconds: 300 },
      ],
    });
    useDailyStore.getState().clearExpired("2026-03-14");
    const stored = JSON.parse(localStorageMock.getItem("nonet:daily-completions")!);
    expect(stored).toHaveLength(1);
    expect(stored[0].date).toBe("2026-03-14");
  });
});

describe("formatTime", () => {
  it("formats seconds as MM:SS", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(372)).toBe("06:12");
    expect(formatTime(3600)).toBe("60:00");
  });
});

describe("getTimeUntilMidnight", () => {
  it("returns a string with hours and/or minutes", () => {
    const result = getTimeUntilMidnight();
    expect(result).toMatch(/^\d+h \d+m$|^\d+m$/);
  });
});
