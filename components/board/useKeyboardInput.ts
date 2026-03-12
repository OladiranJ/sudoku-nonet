"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/store/gameStore";

export function useKeyboardInput() {
  const selectedCell = useGameStore((s) => s.selectedCell);
  const placeDigit = useGameStore((s) => s.placeDigit);
  const erase = useGameStore((s) => s.erase);
  const selectCell = useGameStore((s) => s.selectCell);
  const undo = useGameStore((s) => s.undo);
  const redo = useGameStore((s) => s.redo);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey) || (e.key === "Z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      if (!selectedCell) return;

      // Digits 1-9
      if (e.key >= "1" && e.key <= "9") {
        placeDigit(parseInt(e.key, 10));
        return;
      }

      // Erase
      if (e.key === "Backspace" || e.key === "Delete") {
        erase();
        return;
      }

      // Arrow navigation (clamp at edges)
      const { row, col } = selectedCell;
      switch (e.key) {
        case "ArrowUp":    if (row > 0) selectCell(row - 1, col); break;
        case "ArrowDown":  if (row < 8) selectCell(row + 1, col); break;
        case "ArrowLeft":  if (col > 0) selectCell(row, col - 1); break;
        case "ArrowRight": if (col < 8) selectCell(row, col + 1); break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, placeDigit, erase, selectCell, undo, redo]);
}
