import { create } from "zustand";

const STORAGE_KEY = "nonet:theme";

export type Theme = "light" | "dark";

export interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
  hydrate: () => void;
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function saveToStorage(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage may be unavailable
  }
}

function loadFromStorage(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "dark" || raw === "light") return raw;
    return null;
  } catch {
    return null;
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",

  toggle: () => {
    const next = get().theme === "light" ? "dark" : "light";
    applyTheme(next);
    saveToStorage(next);
    set({ theme: next });
  },

  setTheme: (theme: Theme) => {
    applyTheme(theme);
    saveToStorage(theme);
    set({ theme });
  },

  hydrate: () => {
    const saved = loadFromStorage();
    const theme = saved ?? "light";
    applyTheme(theme);
    set({ theme });
  },
}));
