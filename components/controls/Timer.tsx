"use client";

import { useTimerStore } from "@/lib/store/timerStore";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Timer() {
  const elapsed = useTimerStore((s) => s.elapsed);
  const isPaused = useTimerStore((s) => s.isPaused);
  const isRunning = useTimerStore((s) => s.isRunning);
  const pause = useTimerStore((s) => s.pause);
  const resume = useTimerStore((s) => s.resume);

  return (
    <div data-testid="timer" className="flex items-center gap-2 text-sm font-medium">
      <span data-testid="timer-display">{formatTime(elapsed)}</span>
      {isRunning && (
        <button
          data-testid="timer-pause"
          onClick={pause}
          className="px-2 py-1 rounded text-xs hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 transition-transform"
          aria-label="Pause"
        >
          ⏸
        </button>
      )}
      {isPaused && (
        <button
          data-testid="timer-resume"
          onClick={resume}
          className="px-2 py-1 rounded text-xs hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 transition-transform"
          aria-label="Resume"
        >
          ▶
        </button>
      )}
    </div>
  );
}
