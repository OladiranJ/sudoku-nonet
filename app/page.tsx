"use client";

import { useState, useEffect } from "react";
import Board from "@/components/board/Board";
import Numpad from "@/components/numpad/Numpad";
import NewGameModal from "@/components/modals/NewGameModal";
import CompletionModal from "@/components/modals/CompletionModal";
import { useGameStore } from "@/lib/store/gameStore";
import { useTimerStore } from "@/lib/store/timerStore";
import { createPuzzle } from "@/lib/sudoku/puzzle";

export default function Home() {
  const puzzle = useGameStore((s) => s.puzzle);
  const difficulty = useGameStore((s) => s.difficulty);
  const isComplete = useGameStore((s) => s.isComplete);
  const startGame = useGameStore((s) => s.startGame);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    if (!puzzle) {
      startGame(createPuzzle("demo-seed", "easy"));
    }
  }, [puzzle, startGame]);

  // Show completion modal when puzzle is solved
  useEffect(() => {
    if (isComplete) {
      setShowCompletionModal(true);
    }
  }, [isComplete]);

  const handlePlayAgain = () => {
    setShowCompletionModal(false);
    if (difficulty) {
      const seed = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const newPuzzle = createPuzzle(seed, difficulty);
      startGame(newPuzzle, { seed });
      useTimerStore.getState().start();
    }
  };

  const handleNewGame = () => {
    setShowCompletionModal(false);
    setShowNewGameModal(true);
  };

  if (!puzzle) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">Nonet</h1>
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full max-w-3xl">
        <div className="w-full max-w-lg">
          <Board />
        </div>
        <div className="w-full max-w-xs flex flex-col gap-4">
          <Numpad />
          <button
            onClick={() => setShowNewGameModal(true)}
            className="w-full py-3 px-4 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            data-testid="new-game-button"
          >
            New Game
          </button>
        </div>
      </div>
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onPlayAgain={handlePlayAgain}
        onNewGame={handleNewGame}
      />
      <NewGameModal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
      />
    </main>
  );
}
