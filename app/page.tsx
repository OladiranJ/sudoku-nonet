"use client";

import { useEffect } from "react";
import Board from "@/components/board/Board";
import Numpad from "@/components/numpad/Numpad";
import { useGameStore } from "@/lib/store/gameStore";
import { createPuzzle } from "@/lib/sudoku/puzzle";

export default function Home() {
  const puzzle = useGameStore((s) => s.puzzle);
  const startGame = useGameStore((s) => s.startGame);

  useEffect(() => {
    if (!puzzle) {
      startGame(createPuzzle("demo-seed", "easy"));
    }
  }, [puzzle, startGame]);

  if (!puzzle) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">Nonet</h1>
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full max-w-3xl">
        <div className="w-full max-w-lg">
          <Board />
        </div>
        <div className="w-full max-w-xs">
          <Numpad />
        </div>
      </div>
    </main>
  );
}
