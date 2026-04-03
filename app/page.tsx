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
import { trpc } from "@/lib/trpc/client";

export default function Home() {
  const puzzle = useGameStore((s) => s.puzzle);
  const difficulty = useGameStore((s) => s.difficulty);
  const isComplete = useGameStore((s) => s.isComplete);
  const seed = useGameStore((s) => s.seed);
  const isDaily = useGameStore((s) => s.isDaily);
  const puzzleDate = useGameStore((s) => s.puzzleDate);
  const errorCount = useGameStore((s) => s.errorCount);
  const hintCount = useGameStore((s) => s.hintCount);
  const startGame = useGameStore((s) => s.startGame);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [lastGameId, setLastGameId] = useState<string | null>(null);

  const submitGame = trpc.game.submitGame.useMutation({
    onSuccess: (data) => {
      if (data?.id) {
        setLastGameId(data.id);
      }
    },
  });

  useEffect(() => {
    if (!puzzle) {
      startGame(createPuzzle("demo-seed", "easy"));
    }
  }, [puzzle, startGame]);

  useEffect(() => {
    if (isComplete) {
      setShowCompletionModal(true);
      setLastGameId(null);

      // Submit game for logged-in users
      const elapsed = useTimerStore.getState().elapsed;
      if (seed && difficulty) {
        submitGame.mutate({
          seed,
          difficulty: difficulty as "easy" | "medium" | "hard" | "expert",
          time_seconds: elapsed,
          error_count: errorCount,
          hint_count: hintCount,
          is_daily: isDaily,
          puzzle_date: puzzleDate,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div
            className="relative w-full max-w-lg rounded-xl overflow-hidden"
            data-testid="board-section"
            style={{
              boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px var(--p-grid)",
            }}
          >
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
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors duration-150 cursor-pointer"
              style={{
                background: "var(--p-primary)",
                color: "var(--p-cell)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              data-testid="new-game-button"
            >
              New Game
            </button>
          </div>
        </div>
      </main>

      <CompletionModal
        isOpen={showCompletionModal}
        gameId={lastGameId}
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
