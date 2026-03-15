import { create } from "zustand";
import type { Difficulty } from "@/lib/sudoku/puzzle";

const STORAGE_PREFIX = "nonet:daily-completions";

export interface DailyCompletion {
  difficulty: Difficulty;
  date: string; // "YYYY-MM-DD"
  timeSeconds: number;
}

export interface DailyState {
  completions: DailyCompletion[];

  markCompleted: (difficulty: Difficulty, date: string, timeSeconds: number) => void;
  isDailyCompleted: (difficulty: Difficulty, date: string) => boolean;
  getCompletionTime: (difficulty: Difficulty, date: string) => number | null;
  clearExpired: (today: string) => void;
  hydrate: (userId?: string) => void;
}

function getStorageKey(userId?: string): string {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

function saveToStorage(completions: DailyCompletion[], userId?: string): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(completions));
  } catch {
    // localStorage may be full or unavailable
  }
}

function loadFromStorage(userId?: string): DailyCompletion[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as DailyCompletion[];
  } catch {
    return [];
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export const useDailyStore = create<DailyState>((set, get) => ({
  completions: [],

  markCompleted: (difficulty: Difficulty, date: string, timeSeconds: number) => {
    const { completions } = get();
    // Don't add duplicate
    const exists = completions.some(
      (c) => c.difficulty === difficulty && c.date === date
    );
    if (exists) return;

    const updated = [...completions, { difficulty, date, timeSeconds }];
    set({ completions: updated });
    saveToStorage(updated);
  },

  isDailyCompleted: (difficulty: Difficulty, date: string) => {
    return get().completions.some(
      (c) => c.difficulty === difficulty && c.date === date
    );
  },

  getCompletionTime: (difficulty: Difficulty, date: string) => {
    const entry = get().completions.find(
      (c) => c.difficulty === difficulty && c.date === date
    );
    return entry ? entry.timeSeconds : null;
  },

  clearExpired: (today: string) => {
    const { completions } = get();
    const filtered = completions.filter((c) => c.date >= today);
    if (filtered.length !== completions.length) {
      set({ completions: filtered });
      saveToStorage(filtered);
    }
  },

  hydrate: (userId?: string) => {
    const loaded = loadFromStorage(userId);
    set({ completions: loaded });
  },
}));
