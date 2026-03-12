import type { Puzzle } from "@/lib/sudoku/puzzle";
import Cell from "./Cell";

interface BoardProps {
  puzzle: Puzzle;
}

export default function Board({ puzzle }: BoardProps) {
  const { board } = puzzle;

  return (
    <div
      className="grid aspect-square w-full max-w-lg mx-auto"
      style={{ gridTemplateColumns: "repeat(9, 1fr)", gridTemplateRows: "repeat(9, 1fr)" }}
      role="grid"
      aria-label="Sudoku board"
    >
      {board.map((row, rowIndex) =>
        row.map((value, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            value={value}
            isClue={value !== 0}
            row={rowIndex}
            col={colIndex}
          />
        ))
      )}
    </div>
  );
}
