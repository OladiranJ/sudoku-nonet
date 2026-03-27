import { create } from "zustand";
import { playClickSound, playChimeSound } from "@/lib/audio/sounds";

const STORAGE_KEY = "nonet:audio";

export interface AudioState {
  enabled: boolean;
  toggle: () => void;
  hydrate: () => void;
  playClick: () => void;
  playChime: () => void;
}

function saveToStorage(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
  } catch {
    // localStorage may be unavailable
  }
}

function loadFromStorage(): boolean | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    return JSON.parse(raw) === true;
  } catch {
    return null;
  }
}

export const useAudioStore = create<AudioState>((set, get) => ({
  enabled: false,

  toggle: () => {
    const next = !get().enabled;
    saveToStorage(next);
    set({ enabled: next });
  },

  hydrate: () => {
    const saved = loadFromStorage();
    const enabled = saved ?? false;
    set({ enabled });
  },

  playClick: () => {
    if (get().enabled) playClickSound();
  },

  playChime: () => {
    if (get().enabled) playChimeSound();
  },
}));
