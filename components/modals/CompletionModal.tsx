"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useGameStore } from "@/lib/store/gameStore";
import { useTimerStore } from "@/lib/store/timerStore";
import { formatTime } from "@/lib/store/dailyStore";

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export default function CompletionModal({
  isOpen,
  onClose,
  onPlayAgain,
  onNewGame,
}: CompletionModalProps) {
  const difficulty = useGameStore((s) => s.difficulty);
  const errorCount = useGameStore((s) => s.errorCount);
  const hintCount = useGameStore((s) => s.hintCount);
  const isDaily = useGameStore((s) => s.isDaily);
  const elapsed = useTimerStore((s) => s.elapsed);

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const difficultyLabel = difficulty
    ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="completion-modal"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Puzzle Complete!</h2>

        <span
          className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
          data-testid="puzzle-badge"
          style={{
            backgroundColor: isDaily ? "#dbeafe" : "#f3e8ff",
            color: isDaily ? "#1d4ed8" : "#7c3aed",
          }}
        >
          {isDaily ? "Daily" : "Random"}
        </span>

        <div className="flex flex-col gap-2 mb-6 text-left">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Difficulty</span>
            <span className="font-medium" data-testid="stat-difficulty">
              {difficultyLabel}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Time</span>
            <span className="font-medium" data-testid="stat-time">
              {formatTime(elapsed)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Errors</span>
            <span className="font-medium" data-testid="stat-errors">
              {errorCount}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Hints</span>
            <span className="font-medium" data-testid="stat-hints">
              {hintCount}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-4 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            data-action="play-again"
          >
            Play Again
          </button>
          <button
            onClick={onNewGame}
            className="w-full py-3 px-4 rounded-md border border-gray-200 font-medium hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            data-action="new-game"
          >
            New Game
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 text-sm"
            data-action="share"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
