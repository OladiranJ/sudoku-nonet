import { create } from "zustand";
import { getPaletteById, getActiveColors, getPaletteCSSVars, DEFAULT_PALETTE_ID } from "@/lib/theme/palettes";
import type { Palette } from "@/lib/theme/palettes";

const THEME_KEY = "nonet:theme";
const PALETTE_KEY = "nonet:palette";

export type Theme = "light" | "dark";

export interface ThemeState {
  theme: Theme;
  paletteId: string;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
  setPalette: (id: string) => void;
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

function applyPalette(paletteId: string, theme: Theme): void {
  if (typeof document === "undefined") return;
  const palette = getPaletteById(paletteId);
  const colors = getActiveColors(palette, theme);
  const vars = getPaletteCSSVars(colors);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

function saveToStorage(theme: Theme, paletteId: string): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(PALETTE_KEY, paletteId);
  } catch {
    // localStorage may be unavailable
  }
}

function loadThemeFromStorage(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === "dark" || raw === "light") return raw;
    return null;
  } catch {
    return null;
  }
}

function loadPaletteFromStorage(): string | null {
  try {
    return localStorage.getItem(PALETTE_KEY);
  } catch {
    return null;
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  paletteId: DEFAULT_PALETTE_ID,

  toggle: () => {
    const next = get().theme === "light" ? "dark" : "light";
    const paletteId = get().paletteId;
    applyTheme(next);
    applyPalette(paletteId, next);
    saveToStorage(next, paletteId);
    set({ theme: next });
  },

  setTheme: (theme: Theme) => {
    const paletteId = get().paletteId;
    applyTheme(theme);
    applyPalette(paletteId, theme);
    saveToStorage(theme, paletteId);
    set({ theme });
  },

  setPalette: (id: string) => {
    const theme = get().theme;
    applyPalette(id, theme);
    saveToStorage(theme, id);
    set({ paletteId: id });
  },

  hydrate: () => {
    const savedTheme = loadThemeFromStorage();
    const savedPalette = loadPaletteFromStorage();
    const theme = savedTheme ?? "light";
    const paletteId = savedPalette ?? DEFAULT_PALETTE_ID;
    applyTheme(theme);
    applyPalette(paletteId, theme);
    set({ theme, paletteId });
  },
}));
