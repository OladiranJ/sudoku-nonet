"use client";

import { useState, useCallback, useMemo } from "react";
import type { Puzzle } from "@/lib/sudoku/puzzle";
import { getConflicts } from "@/lib/sudoku/conflicts";
import { useGameStore } from "@/lib/store/gameStore";
import { useKeyboardInput } from "./useKeyboardInput";
import Cell from "./Cell";

interface BoardProps {
  /** Pass puzzle directly for standalone/test usage. Omit to read from store. */
  puzzle?: Puzzle;
  /** Override the displayed board (for conflict tests). Omit to read from store. */
  currentBoard?: number[][];
}

function isPeer(selRow: number, selCol: number, row: number, col: number): boolean {
  if (row === selRow && col === selCol) return false;
  if (row === selRow) return true;
  if (col === selCol) return true;
  return Math.floor(row / 3) === Math.floor(selRow / 3)
      && Math.floor(col / 3) === Math.floor(selCol / 3);
}

export default function Board({ puzzle: puzzleProp, currentBoard: currentBoardProp }: BoardProps) {
  // Props-first: use props if provided, otherwise fall back to store
  const storePuzzle = useGameStore((s) => s.puzzle);
  const storeBoard = useGameStore((s) => s.currentBoard);
  const storeSelectedCell = useGameStore((s) => s.selectedCell);
  const storeSelectCell = useGameStore((s) => s.selectCell);
  const storeNotes = useGameStore((s) => s.notes);

  const puzzle = puzzleProp ?? storePuzzle;
  const usingProps = puzzleProp !== undefined;

  // Local selection state for prop-based mode (backward compat with existing tests)
  const [localSelectedCell, setLocalSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const selectedCell = usingProps ? localSelectedCell : storeSelectedCell;
  const displayBoard = currentBoardProp ?? (usingProps ? puzzle!.board : storeBoard);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (usingProps) {
      setLocalSelectedCell({ row, col });
    } else {
      storeSelectCell(row, col);
    }
  }, [usingProps, storeSelectCell]);

  useKeyboardInput();

  const selectedValue = selectedCell ? displayBoard[selectedCell.row][selectedCell.col] : 0;
  const conflicts = useMemo(() => getConflicts(displayBoard), [displayBoard]);

  if (!puzzle) return null;

  return (
    <div
      className="grid aspect-square w-full max-w-lg mx-auto"
      style={{ gridTemplateColumns: "repeat(9, 1fr)", gridTemplateRows: "repeat(9, 1fr)" }}
      role="grid"
      aria-label="Sudoku board"
    >
      {displayBoard.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const isClue = puzzle.board[rowIndex][colIndex] !== 0;
          const isSelected = selectedCell !== null
            && selectedCell.row === rowIndex
            && selectedCell.col === colIndex;
          const peer = selectedCell !== null && isPeer(selectedCell.row, selectedCell.col, rowIndex, colIndex);
          const sameNumber = !isSelected && selectedValue !== 0 && value !== 0 && value === selectedValue;
          const isConflict = conflicts.has(`${rowIndex},${colIndex}`);

          return (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              value={value}
              isClue={isClue}
              row={rowIndex}
              col={colIndex}
              isSelected={isSelected}
              isPeer={peer}
              isSameNumber={sameNumber}
              isConflict={isConflict}
              notes={!usingProps ? storeNotes[rowIndex][colIndex] : undefined}
              onClick={handleCellClick}
            />
          );
        })
      )}
    </div>
  );
}
