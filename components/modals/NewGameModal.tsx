"use client";

import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { useTimerStore } from "@/lib/store/timerStore";
import { saveGameState } from "@/lib/store/autoSave";
import { createPuzzle, type Difficulty } from "@/lib/sudoku/puzzle";
import { getDailySeed } from "@/lib/sudoku/daily";
import { useDailyStore, formatTime, getTimeUntilMidnight } from "@/lib/store/dailyStore";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "expert", label: "Expert" },
];

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewGameModal({ isOpen, onClose }: NewGameModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);

  const startGame = useGameStore((s) => s.startGame);
  const puzzle = useGameStore((s) => s.puzzle);
  const isDailyCompleted = useDailyStore((s) => s.isDailyCompleted);
  const getCompletionTime = useDailyStore((s) => s.getCompletionTime);

  const today = new Date().toISOString().split("T")[0];
  const dailyLocked = selectedDifficulty
    ? isDailyCompleted(selectedDifficulty, today)
    : false;
  const dailyTime = selectedDifficulty
    ? getCompletionTime(selectedDifficulty, today)
    : null;

  // Reset state and hydrate daily completions when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDifficulty(null);
      useDailyStore.getState().hydrate();
    }
  }, [isOpen]);

  const handleDifficultySelect = useCallback((difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setStep(2);
  }, []);

  const handleStartGame = useCallback(
    (type: "daily" | "random") => {
      if (!selectedDifficulty) return;

      // Auto-save in-progress game before starting new one
      if (puzzle) {
        saveGameState();
      }

      let seed: string;
      let isDaily = false;
      let puzzleDate: string | undefined;

      if (type === "daily") {
        const today = new Date().toISOString().split("T")[0];
        seed = getDailySeed(today, selectedDifficulty);
        isDaily = true;
        puzzleDate = today;
      } else {
        seed = Math.random().toString(36).slice(2) + Date.now().toString(36);
      }

      const newPuzzle = createPuzzle(seed, selectedDifficulty);
      startGame(newPuzzle, { seed, isDaily, puzzleDate });
      useTimerStore.getState().start();
      onClose();
    },
    [selectedDifficulty, puzzle, startGame, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      data-testid="new-game-modal"
    >
      <div
        className="rounded-xl p-6 w-full max-w-sm mx-4"
        style={{
          background: "var(--p-cell)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.15), 0 0 0 1px var(--p-grid)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--p-text)" }}>
            {step === 1 ? "Select Difficulty" : "Select Puzzle Type"}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none cursor-pointer"
            style={{ color: "var(--p-text-muted)" }}
            aria-label="Close"
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--p-text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--p-text-muted)"; }}
          >
            &times;
          </button>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-3" data-testid="step-difficulty">
            {DIFFICULTIES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleDifficultySelect(value)}
                className="w-full py-3 px-4 rounded-lg text-left font-medium transition-colors duration-150 cursor-pointer"
                style={{
                  border: "1px solid var(--p-grid)",
                  color: "var(--p-text)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--p-primary-soft)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                data-difficulty={value}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3" data-testid="step-puzzle-type">
            <button
              onClick={() => !dailyLocked && handleStartGame("daily")}
              className="w-full py-3 px-4 rounded-lg text-left font-medium transition-colors duration-150"
              style={{
                border: "1px solid var(--p-grid)",
                color: dailyLocked ? "var(--p-text-subtle)" : "var(--p-text)",
                background: dailyLocked ? "var(--p-cell-hover)" : "transparent",
                cursor: dailyLocked ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!dailyLocked) e.currentTarget.style.background = "var(--p-primary-soft)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = dailyLocked ? "var(--p-cell-hover)" : "transparent";
              }}
              data-puzzle-type="daily"
              disabled={dailyLocked}
              aria-disabled={dailyLocked}
            >
              {dailyLocked ? (
                <span data-testid="daily-locked">
                  <span className="block">Daily Puzzle — Completed in {formatTime(dailyTime!)}</span>
                  <span className="block text-xs mt-1" style={{ color: "var(--p-text-subtle)" }} data-testid="daily-countdown">
                    Next daily in {getTimeUntilMidnight()}
                  </span>
                </span>
              ) : (
                "Daily Puzzle"
              )}
            </button>
            <button
              onClick={() => handleStartGame("random")}
              className="w-full py-3 px-4 rounded-lg text-left font-medium transition-colors duration-150 cursor-pointer"
              style={{
                border: "1px solid var(--p-grid)",
                color: "var(--p-text)",
                background: "transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--p-primary-soft)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              data-puzzle-type="random"
            >
              Random Puzzle
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-2 px-4 text-sm cursor-pointer"
              style={{ color: "var(--p-text-muted)" }}
              data-action="back"
            >
              &larr; Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
