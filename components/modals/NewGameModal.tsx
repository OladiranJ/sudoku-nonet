"use client";

import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { useTimerStore } from "@/lib/store/timerStore";
import { saveGameState } from "@/lib/store/autoSave";
import { createPuzzle, type Difficulty } from "@/lib/sudoku/puzzle";
import { getDailySeed } from "@/lib/sudoku/daily";

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDifficulty(null);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="new-game-modal"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {step === 1 ? "Select Difficulty" : "Select Puzzle Type"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
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
                className="w-full py-3 px-4 rounded-md border border-gray-200 text-left font-medium hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
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
              onClick={() => handleStartGame("daily")}
              className="w-full py-3 px-4 rounded-md border border-gray-200 text-left font-medium hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              data-puzzle-type="daily"
            >
              Daily Puzzle
            </button>
            <button
              onClick={() => handleStartGame("random")}
              className="w-full py-3 px-4 rounded-md border border-gray-200 text-left font-medium hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              data-puzzle-type="random"
            >
              Random Puzzle
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 text-sm"
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
