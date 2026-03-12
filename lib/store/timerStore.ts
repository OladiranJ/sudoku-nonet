import { create } from "zustand";

export interface TimerState {
  elapsed: number; // seconds
  isRunning: boolean;
  isPaused: boolean;
  isStopped: boolean; // permanently stopped on completion

  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  tick: () => void;
  setElapsed: (n: number) => void;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

function startInterval() {
  stopInterval();
  intervalId = setInterval(() => {
    useTimerStore.getState().tick();
  }, 1000);
}

function stopInterval() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export const useTimerStore = create<TimerState>((set, get) => ({
  elapsed: 0,
  isRunning: false,
  isPaused: false,
  isStopped: false,

  start: () => {
    const { isStopped } = get();
    if (isStopped) return;
    set({ elapsed: 0, isRunning: true, isPaused: false, isStopped: false });
    startInterval();
  },

  pause: () => {
    const { isRunning } = get();
    if (!isRunning) return;
    stopInterval();
    set({ isRunning: false, isPaused: true });
  },

  resume: () => {
    const { isStopped, isPaused } = get();
    if (isStopped || !isPaused) return;
    set({ isRunning: true, isPaused: false });
    startInterval();
  },

  stop: () => {
    stopInterval();
    set({ isRunning: false, isPaused: false, isStopped: true });
  },

  reset: () => {
    stopInterval();
    set({ elapsed: 0, isRunning: false, isPaused: false, isStopped: false });
  },

  tick: () => set((s) => ({ elapsed: s.elapsed + 1 })),

  setElapsed: (n: number) => set({ elapsed: n }),
}));
