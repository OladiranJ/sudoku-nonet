"use client";

import { useState, useCallback, useMemo } from "react";
import type { Puzzle } from "@/lib/sudoku/puzzle";
import { getConflicts } from "@/lib/sudoku/conflicts";
import Cell from "./Cell";

interface BoardProps {
  puzzle: Puzzle;
  currentBoard?: number[][];
}

function isPeer(selRow: number, selCol: number, row: number, col: number): boolean {
  if (row === selRow && col === selCol) return false;
  if (row === selRow) return true;
  if (col === selCol) return true;
  return Math.floor(row / 3) === Math.floor(selRow / 3)
      && Math.floor(col / 3) === Math.floor(selCol / 3);
}

export default function Board({ puzzle, currentBoard }: BoardProps) {
  const displayBoard = currentBoard ?? puzzle.board;
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
  }, []);

  const selectedValue = selectedCell ? displayBoard[selectedCell.row][selectedCell.col] : 0;
  const conflicts = useMemo(() => getConflicts(displayBoard), [displayBoard]);

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
              onClick={handleCellClick}
            />
          );
        })
      )}
    </div>
  );
}
