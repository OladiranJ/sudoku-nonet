interface CellProps {
  value: number;
  isClue: boolean;
  row: number;
  col: number;
  isSelected?: boolean;
  isPeer?: boolean;
  isSameNumber?: boolean;
  isConflict?: boolean;
  notes?: Set<number>;
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
  isSameNumber: boolean,
  isConflict: boolean
): string {
  if (isSelected) return "cell-selected bg-blue-200 dark:bg-blue-900";
  if (isConflict) return "cell-conflict bg-red-100 dark:bg-red-900/40";
  if (isSameNumber) return "cell-same-number bg-blue-100 dark:bg-blue-950";
  if (isPeer) return "cell-peer bg-slate-100 dark:bg-slate-800";
  return isClue ? "bg-slate-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900";
}

function NotesGrid({ notes }: { notes: Set<number> }) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 w-full h-full" data-notes>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <span
          key={d}
          className="flex items-center justify-center text-[9px] leading-none text-slate-500 dark:text-slate-400"
          data-note-digit={d}
        >
          {notes.has(d) ? d : ""}
        </span>
      ))}
    </div>
  );
}

export default function Cell({
  value, isClue, row, col,
  isSelected = false, isPeer = false, isSameNumber = false, isConflict = false,
  notes,
  onClick,
}: CellProps) {
  const borderClasses = getBorderClasses(row, col);
  const highlightClasses = getHighlightClasses(isClue, isSelected, isPeer, isSameNumber, isConflict);

  const baseClasses =
    "flex items-center justify-center text-lg select-none transition-colors duration-150 cursor-pointer";

  const textClasses = isConflict && !isSelected
    ? "font-normal text-red-700 dark:text-red-400"
    : isClue ? "font-bold text-slate-900 dark:text-slate-100" : "font-normal text-indigo-800 dark:text-indigo-300";

  const hasNotes = notes && notes.size > 0 && value === 0;

  return (
    <div
      data-cell
      data-clue={isClue ? "true" : "false"}
      data-row={row}
      data-col={col}
      data-conflict={isConflict ? "true" : undefined}
      role="gridcell"
      tabIndex={0}
      aria-readonly={isClue ? true : undefined}
      aria-selected={isSelected ? true : undefined}
      className={`${baseClasses} ${hasNotes ? "" : textClasses} ${highlightClasses} ${borderClasses} border-slate-800 dark:border-slate-500`}
      onClick={() => onClick?.(row, col)}
    >
      {hasNotes ? <NotesGrid notes={notes} /> : value > 0 ? value : ""}
    </div>
  );
}
