"use client";

import { useState, useEffect } from "react";
import Board from "@/components/board/Board";
import Numpad from "@/components/numpad/Numpad";
import Header from "@/components/layout/Header";
import GameInfo from "@/components/layout/GameInfo";
import PauseOverlay from "@/components/controls/PauseOverlay";
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
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col items-center px-4 pb-4 md:px-6 md:pb-6">
        {/* Mobile: GameInfo bar above board */}
        <div className="w-full max-w-lg md:hidden py-2">
          <GameInfo />
        </div>

        {/* Responsive layout container */}
        <div
          data-testid="layout-container"
          className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full max-w-4xl"
        >
          {/* Board section */}
          <div className="relative w-full max-w-lg" data-testid="board-section">
            <Board />
            <PauseOverlay />
          </div>

          {/* Controls panel */}
          <div
            data-testid="controls-panel"
            className="w-full max-w-xs flex flex-col gap-4"
          >
            {/* Desktop: GameInfo inside controls panel */}
            <div className="hidden md:block">
              <GameInfo />
            </div>

            <Numpad />

            <button
              onClick={() => setShowNewGameModal(true)}
              className="w-full py-3 px-4 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 active:bg-slate-900 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 transition-colors duration-150"
              data-testid="new-game-button"
            >
              New Game
            </button>
          </div>
        </div>
      </main>

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
    </div>
  );
}
