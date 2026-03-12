interface CellProps {
  value: number;
  isClue: boolean;
  row: number;
  col: number;
  isSelected?: boolean;
  isPeer?: boolean;
  isSameNumber?: boolean;
  onClick?: (row: number, col: number) => void;
}

function getBorderClasses(row: number, col: number): string {
  const classes: string[] = [];
  classes.push(row % 3 === 0 ? "border-t-2" : "border-t");
  classes.push(col % 3 === 0 ? "border-l-2" : "border-l");
  if (row === 8) classes.push("border-b-2");
  if (col === 8) classes.push("border-r-2");
  return classes.join(" ");
}

function getHighlightClasses(
  isClue: boolean,
  isSelected: boolean,
  isPeer: boolean,
  isSameNumber: boolean
): string {
  if (isSelected) return "cell-selected bg-blue-200";
  if (isSameNumber) return "cell-same-number bg-blue-100";
  if (isPeer) return "cell-peer bg-slate-100";
  return isClue ? "bg-slate-50" : "bg-white";
}

export default function Cell({
  value, isClue, row, col,
  isSelected = false, isPeer = false, isSameNumber = false,
  onClick,
}: CellProps) {
  const borderClasses = getBorderClasses(row, col);
  const highlightClasses = getHighlightClasses(isClue, isSelected, isPeer, isSameNumber);

  const baseClasses =
    "flex items-center justify-center text-lg select-none transition-colors duration-150 cursor-pointer";

  const textClasses = isClue ? "font-bold text-slate-900" : "font-normal text-indigo-800";

  return (
    <div
      data-cell
      data-clue={isClue ? "true" : "false"}
      data-row={row}
      data-col={col}
      role="gridcell"
      tabIndex={0}
      aria-readonly={isClue ? true : undefined}
      aria-selected={isSelected ? true : undefined}
      className={`${baseClasses} ${textClasses} ${highlightClasses} ${borderClasses} border-slate-800`}
      onClick={() => onClick?.(row, col)}
    >
      {value > 0 ? value : ""}
    </div>
  );
}
