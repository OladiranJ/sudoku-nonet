"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Puzzle } from "@/lib/sudoku/puzzle";
import { getConflicts } from "@/lib/sudoku/conflicts";
import { useGameStore } from "@/lib/store/gameStore";
import { useAudioStore } from "@/lib/store/audioStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useKeyboardInput } from "./useKeyboardInput";
import Cell from "./Cell";

interface BoardProps {
  /** Pass puzzle directly for standalone/test usage. Omit to read from store. */
  puzzle?: Puzzle;
  /** Override the displayed board (for conflict tests). Omit to read from store. */
  currentBoard?: number[][];
}

function isRowColPeer(selRow: number, selCol: number, row: number, col: number): boolean {
  if (row === selRow && col === selCol) return false;
  return row === selRow || col === selCol;
}

function isBoxPeer(selRow: number, selCol: number, row: number, col: number): boolean {
  if (row === selRow && col === selCol) return false;
  if (row === selRow || col === selCol) return false; // already handled by row/col
  return Math.floor(row / 3) === Math.floor(selRow / 3)
      && Math.floor(col / 3) === Math.floor(selCol / 3);
}

export default function Board({ puzzle: puzzleProp, currentBoard: currentBoardProp }: BoardProps) {
  // Props-first: use props if provided, otherwise fall back to store
  const storePuzzle = useGameStore((s) => s.puzzle);
  const storeBoard = useGameStore((s) => s.currentBoard);
  const storeSelectedCell = useGameStore((s) => s.selectedCell);
  const storeSelectCell = useGameStore((s) => s.selectCell);
  const storeDeselectCell = useGameStore((s) => s.deselectCell);
  const storeNotes = useGameStore((s) => s.notes);

  // Settings
  const highlightRowCol = useSettingsStore((s) => s.highlightRowCol);
  const highlightBox = useSettingsStore((s) => s.highlightBox);
  const highlightIdenticalNumbers = useSettingsStore((s) => s.highlightIdenticalNumbers);

  const puzzle = puzzleProp ?? storePuzzle;
  const usingProps = puzzleProp !== undefined;

  // Local selection state for prop-based mode (backward compat with existing tests)
  const [localSelectedCell, setLocalSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const selectedCell = usingProps ? localSelectedCell : storeSelectedCell;
  const displayBoard = currentBoardProp ?? (usingProps ? puzzle!.board : storeBoard);

  const boardRef = useRef<HTMLDivElement>(null);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (usingProps) {
      setLocalSelectedCell({ row, col });
    } else {
      storeSelectCell(row, col);
      useAudioStore.getState().playClick();
    }
  }, [usingProps, storeSelectCell]);

  // Deselect when clicking outside the board
  useEffect(() => {
    if (usingProps) return;

    function handleOutsideClick(e: MouseEvent) {
      if (boardRef.current && !boardRef.current.contains(e.target as Node)) {
        // Don't deselect if clicking inside numpad or controls
        const target = e.target as HTMLElement;
        if (target.closest("[data-numpad]") || target.closest("[data-controls]")) return;
        storeDeselectCell();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [usingProps, storeDeselectCell]);

  useKeyboardInput();

  const selectedValue = selectedCell ? displayBoard[selectedCell.row][selectedCell.col] : 0;

  // Build a set of cells that have the selected number in their notes
  const noteMatchCells = useMemo(() => {
    const matches = new Set<string>();
    if (!highlightIdenticalNumbers || selectedValue === 0 || usingProps) return matches;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (displayBoard[r][c] === 0 && storeNotes[r][c]?.has(selectedValue)) {
          matches.add(`${r},${c}`);
        }
      }
    }
    return matches;
  }, [highlightIdenticalNumbers, selectedValue, displayBoard, storeNotes, usingProps]);

  const conflicts = useMemo(() => getConflicts(displayBoard), [displayBoard]);

  if (!puzzle) return null;

  return (
    <div
      ref={boardRef}
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

          // Determine peer status based on settings
          let isRowColHighlight = false;
          let isBoxHighlight = false;
          if (selectedCell !== null) {
            if (highlightRowCol) {
              isRowColHighlight = isRowColPeer(selectedCell.row, selectedCell.col, rowIndex, colIndex);
            }
            if (highlightBox) {
              isBoxHighlight = isBoxPeer(selectedCell.row, selectedCell.col, rowIndex, colIndex);
            }
          }
          const peer = isRowColHighlight || isBoxHighlight;

          // Same-number highlight: cells with matching digit + notes containing the digit
          let sameNumber = false;
          if (highlightIdenticalNumbers && !isSelected && selectedValue !== 0) {
            if (value !== 0 && value === selectedValue) {
              sameNumber = true;
            } else if (noteMatchCells.has(`${rowIndex},${colIndex}`)) {
              sameNumber = true;
            }
          }

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
              selectedValue={highlightIdenticalNumbers ? selectedValue : 0}
              onClick={handleCellClick}
            />
          );
        })
      )}
    </div>
  );
}
