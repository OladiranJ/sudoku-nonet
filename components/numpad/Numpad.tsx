"use client";

import { useGameStore, getDigitCounts } from "@/lib/store/gameStore";

export default function Numpad() {
  const currentBoard = useGameStore((s) => s.currentBoard);
  const placeDigit = useGameStore((s) => s.placeDigit);
  const erase = useGameStore((s) => s.erase);
  const notesMode = useGameStore((s) => s.notesMode);
  const toggleNotesMode = useGameStore((s) => s.toggleNotesMode);
  const useHint = useGameStore((s) => s.useHint);
  const isComplete = useGameStore((s) => s.isComplete);

  const digitCounts = getDigitCounts(currentBoard);

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs mx-auto" role="group" aria-label="Number pad">
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
          const isFull = digitCounts[digit] >= 9;
          return (
            <button
              key={digit}
              data-digit={digit}
              disabled={isFull}
              onClick={() => placeDigit(digit)}
              className={`
                flex items-center justify-center h-12 rounded-lg text-xl font-semibold
                transition-colors duration-150
                ${isFull
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 focus-visible:ring-2 focus-visible:ring-brand-500 active:bg-slate-400 dark:active:bg-slate-500 cursor-pointer"
                }
              `}
            >
              {digit}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          data-action="notes"
          onClick={() => toggleNotesMode()}
          className={`flex items-center justify-center h-12 rounded-lg text-base font-medium
            transition-colors duration-150 cursor-pointer
            ${notesMode
              ? "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 active:bg-brand-800"
              : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 focus-visible:ring-2 focus-visible:ring-brand-500 active:bg-slate-400 dark:active:bg-slate-500"
            }`}
          aria-pressed={notesMode}
        >
          {notesMode ? "Notes ON" : "Notes"}
        </button>
        <button
          data-action="erase"
          onClick={() => erase()}
          className="flex items-center justify-center h-12 rounded-lg text-base font-medium
            bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 focus-visible:ring-2 focus-visible:ring-brand-500
            active:bg-slate-400 dark:active:bg-slate-500 cursor-pointer transition-colors duration-150"
        >
          Erase
        </button>
      </div>
      <button
        data-action="hint"
        onClick={() => useHint()}
        disabled={isComplete}
        className={`flex items-center justify-center h-12 rounded-lg text-base font-medium
          transition-colors duration-150
          ${isComplete
            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 focus-visible:ring-2 focus-visible:ring-brand-500 active:bg-amber-300 dark:active:bg-amber-900/80 cursor-pointer"
          }`}
      >
        Hint
      </button>
    </div>
  );
}
