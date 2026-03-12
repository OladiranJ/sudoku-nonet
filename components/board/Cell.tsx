interface CellProps {
  value: number;
  isClue: boolean;
  row: number;
  col: number;
}

/**
 * Compute border classes for 3×3 sub-grid boundaries.
 * Thicker borders at rows/cols 0, 3, 6 (top/left of each box)
 * and at the board edges (row 8 bottom, col 8 right).
 */
function getBorderClasses(row: number, col: number): string {
  const classes: string[] = [];

  // Top border
  classes.push(row % 3 === 0 ? "border-t-2" : "border-t");
  // Left border
  classes.push(col % 3 === 0 ? "border-l-2" : "border-l");
  // Bottom border (only on last row)
  if (row === 8) classes.push("border-b-2");
  // Right border (only on last col)
  if (col === 8) classes.push("border-r-2");

  return classes.join(" ");
}

export default function Cell({ value, isClue, row, col }: CellProps) {
  const borderClasses = getBorderClasses(row, col);

  const baseClasses =
    "flex items-center justify-center text-lg select-none transition-colors duration-150";

  const styleClasses = isClue
    ? "font-bold text-slate-900 bg-slate-50"
    : "font-normal text-indigo-800 bg-white";

  return (
    <div
      data-cell
      data-clue={isClue ? "true" : "false"}
      data-row={row}
      data-col={col}
      aria-readonly={isClue ? true : undefined}
      className={`${baseClasses} ${styleClasses} ${borderClasses} border-slate-800`}
    >
      {value > 0 ? value : ""}
    </div>
  );
}
