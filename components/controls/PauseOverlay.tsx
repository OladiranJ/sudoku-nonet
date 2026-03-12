"use client";

import { useTimerStore } from "@/lib/store/timerStore";

export default function PauseOverlay() {
  const isPaused = useTimerStore((s) => s.isPaused);
  const resume = useTimerStore((s) => s.resume);

  if (!isPaused) return null;

  return (
    <div
      data-testid="pause-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/60"
    >
      <button
        data-testid="resume-button"
        onClick={resume}
        className="px-6 py-3 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 transition-transform"
      >
        Resume
      </button>
    </div>
  );
}
