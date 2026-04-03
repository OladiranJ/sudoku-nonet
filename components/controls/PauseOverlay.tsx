"use client";

import { useTimerStore } from "@/lib/store/timerStore";

export default function PauseOverlay() {
  const isPaused = useTimerStore((s) => s.isPaused);
  const resume = useTimerStore((s) => s.resume);

  if (!isPaused) return null;

  return (
    <div
      data-testid="pause-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md"
      style={{ background: "color-mix(in srgb, var(--p-bg) 80%, transparent)" }}
    >
      <button
        data-testid="resume-button"
        onClick={resume}
        className="px-6 py-3 rounded-lg font-semibold text-lg active:scale-95 transition-transform cursor-pointer"
        style={{
          background: "var(--p-primary)",
          color: "var(--p-cell)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        Resume
      </button>
    </div>
  );
}
