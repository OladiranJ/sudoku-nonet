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
          className="px-2 py-1 rounded text-xs active:scale-95 transition-transform cursor-pointer"
          style={{ color: "var(--p-text)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--p-primary-soft)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          aria-label="Pause"
        >
          \u23F8
        </button>
      )}
      {isPaused && (
        <button
          data-testid="timer-resume"
          onClick={resume}
          className="px-2 py-1 rounded text-xs active:scale-95 transition-transform cursor-pointer"
          style={{ color: "var(--p-text)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--p-primary-soft)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          aria-label="Resume"
        >
          \u25B6
        </button>
      )}
    </div>
  );
}
