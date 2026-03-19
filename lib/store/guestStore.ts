import { create } from "zustand";
import type { Difficulty } from "@/lib/sudoku/puzzle";

const STORAGE_KEY = "nonet:guest-stats";

export interface GuestGameRecord {
  difficulty: Difficulty;
  timeSeconds: number;
  errorCount: number;
  hintCount: number;
  completedAt: string; // ISO timestamp
}

export interface GuestStats {
  solvedCount: number;
  bestTimes: Record<Difficulty, number | null>;
  games: GuestGameRecord[];
}

export interface GuestState extends GuestStats {
  recordGame: (
    difficulty: Difficulty,
    timeSeconds: number,
    errorCount: number,
    hintCount: number
  ) => void;
  hydrate: () => void;
}

function defaultBestTimes(): Record<Difficulty, number | null> {
  return { easy: null, medium: null, hard: null, expert: null };
}

function saveToStorage(stats: GuestStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage may be full or unavailable
  }
}

function loadFromStorage(): GuestStats | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestStats;
  } catch {
    return null;
  }
}

export const useGuestStore = create<GuestState>((set, get) => ({
  solvedCount: 0,
  bestTimes: defaultBestTimes(),
  games: [],

  recordGame: (
    difficulty: Difficulty,
    timeSeconds: number,
    errorCount: number,
    hintCount: number
  ) => {
    const { solvedCount, bestTimes, games } = get();

    const record: GuestGameRecord = {
      difficulty,
      timeSeconds,
      errorCount,
      hintCount,
      completedAt: new Date().toISOString(),
    };

    const currentBest = bestTimes[difficulty];
    const newBestTimes = { ...bestTimes };
    if (currentBest === null || timeSeconds < currentBest) {
      newBestTimes[difficulty] = timeSeconds;
    }

    const updated: GuestStats = {
      solvedCount: solvedCount + 1,
      bestTimes: newBestTimes,
      games: [...games, record],
    };

    set(updated);
    saveToStorage(updated);
  },

  hydrate: () => {
    const loaded = loadFromStorage();
    if (loaded) {
      set({
        solvedCount: loaded.solvedCount,
        bestTimes: { ...defaultBestTimes(), ...loaded.bestTimes },
        games: loaded.games,
      });
    }
  },
}));
