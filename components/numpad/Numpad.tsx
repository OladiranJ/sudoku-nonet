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
              className={`flex items-center justify-center h-12 rounded-lg text-xl font-semibold transition-colors duration-150 ${isFull ? "cursor-not-allowed" : "cursor-pointer"}`}
              style={{
                background: isFull ? "var(--p-grid)" : "var(--p-secondary)",
                color: isFull ? "var(--p-text-subtle)" : "var(--p-text)",
                opacity: isFull ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isFull) e.currentTarget.style.background = "var(--p-box)";
              }}
              onMouseLeave={(e) => {
                if (!isFull) e.currentTarget.style.background = "var(--p-secondary)";
              }}
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
          className="flex items-center justify-center h-12 rounded-lg text-base font-medium transition-colors duration-150 cursor-pointer"
          style={{
            background: notesMode ? "var(--p-primary)" : "var(--p-secondary)",
            color: notesMode ? "var(--p-cell)" : "var(--p-text)",
          }}
          onMouseEnter={(e) => {
            if (!notesMode) e.currentTarget.style.background = "var(--p-box)";
          }}
          onMouseLeave={(e) => {
            if (!notesMode) e.currentTarget.style.background = "var(--p-secondary)";
          }}
          aria-pressed={notesMode}
        >
          {notesMode ? "Notes ON" : "Notes"}
        </button>
        <button
          data-action="erase"
          onClick={() => erase()}
          className="flex items-center justify-center h-12 rounded-lg text-base font-medium transition-colors duration-150 cursor-pointer"
          style={{
            background: "var(--p-secondary)",
            color: "var(--p-text)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--p-box)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--p-secondary)"; }}
        >
          Erase
        </button>
      </div>
      <button
        data-action="hint"
        onClick={() => useHint()}
        disabled={isComplete}
        className="flex items-center justify-center h-12 rounded-lg text-base font-medium transition-colors duration-150"
        style={{
          background: isComplete ? "var(--p-grid)" : "var(--p-primary-hover)",
          color: isComplete ? "var(--p-text-subtle)" : "var(--p-primary)",
          cursor: isComplete ? "not-allowed" : "pointer",
          border: isComplete ? "none" : "1px solid var(--p-primary)",
        }}
        onMouseEnter={(e) => {
          if (!isComplete) e.currentTarget.style.background = "var(--p-primary-soft)";
        }}
        onMouseLeave={(e) => {
          if (!isComplete) e.currentTarget.style.background = "var(--p-primary-hover)";
        }}
      >
        Hint
      </button>
    </div>
  );
}
