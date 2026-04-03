import { create } from "zustand";

const SETTINGS_KEY = "nonet:settings";

export interface SettingsState {
  /** Highlight cells in the same row and column as the selected cell */
  highlightRowCol: boolean;
  /** Highlight cells in the same 3x3 box as the selected cell */
  highlightBox: boolean;
  /** Highlight cells with the same number as the selected cell (including notes) */
  highlightIdenticalNumbers: boolean;

  // Actions
  setHighlightRowCol: (value: boolean) => void;
  setHighlightBox: (value: boolean) => void;
  setHighlightIdenticalNumbers: (value: boolean) => void;
  hydrate: () => void;
}

function saveToStorage(state: Pick<SettingsState, "highlightRowCol" | "highlightBox" | "highlightIdenticalNumbers">): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      highlightRowCol: state.highlightRowCol,
      highlightBox: state.highlightBox,
      highlightIdenticalNumbers: state.highlightIdenticalNumbers,
    }));
  } catch {
    // localStorage may be unavailable
  }
}

function loadFromStorage(): Partial<Pick<SettingsState, "highlightRowCol" | "highlightBox" | "highlightIdenticalNumbers">> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  highlightRowCol: true,
  highlightBox: true,
  highlightIdenticalNumbers: true,

  setHighlightRowCol: (value: boolean) => {
    set({ highlightRowCol: value });
    saveToStorage({ ...get(), highlightRowCol: value });
  },

  setHighlightBox: (value: boolean) => {
    set({ highlightBox: value });
    saveToStorage({ ...get(), highlightBox: value });
  },

  setHighlightIdenticalNumbers: (value: boolean) => {
    set({ highlightIdenticalNumbers: value });
    saveToStorage({ ...get(), highlightIdenticalNumbers: value });
  },

  hydrate: () => {
    const saved = loadFromStorage();
    set({
      highlightRowCol: saved.highlightRowCol ?? true,
      highlightBox: saved.highlightBox ?? true,
      highlightIdenticalNumbers: saved.highlightIdenticalNumbers ?? true,
    });
  },
}));
