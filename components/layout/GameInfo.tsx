"use client";

import Timer from "@/components/controls/Timer";
import ErrorCounter from "@/components/controls/ErrorCounter";
import { useGameStore } from "@/lib/store/gameStore";

export default function GameInfo() {
  const difficulty = useGameStore((s) => s.difficulty);
  const undo = useGameStore((s) => s.undo);
  const redo = useGameStore((s) => s.redo);

  return (
    <div data-testid="game-info" className="flex items-center justify-between gap-3 w-full px-1">
      {difficulty && (
        <span
          data-testid="difficulty-badge"
          className="text-sm font-semibold capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          {difficulty}
        </span>
      )}
      <Timer />
      <ErrorCounter />
      <div className="flex items-center gap-1">
        <button
          data-testid="undo-button"
          onClick={undo}
          aria-label="Undo"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-400 active:bg-slate-200 dark:active:bg-slate-700 transition-colors duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          data-testid="redo-button"
          onClick={redo}
          aria-label="Redo"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-400 active:bg-slate-200 dark:active:bg-slate-700 transition-colors duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
