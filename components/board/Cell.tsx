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
  selectedValue?: number;
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

function getBorderColor(row: number, col: number): string {
  const isBoxTop = row % 3 === 0;
  const isBoxLeft = col % 3 === 0;
  const isBottom = row === 8;
  const isRight = col === 8;
  if (isBoxTop || isBoxLeft || isBottom || isRight) return "var(--p-box)";
  return "var(--p-grid)";
}

function getHighlightBg(
  isClue: boolean,
  isSelected: boolean,
  isPeer: boolean,
  isSameNumber: boolean,
  isConflict: boolean
): string {
  if (isSelected) return "var(--p-selected)";
  if (isConflict) return "var(--p-error-bg-light)";
  if (isSameNumber) return "var(--p-same-number)";
  if (isPeer) return "var(--p-peer)";
  return isClue ? "var(--p-cell-hover)" : "var(--p-cell)";
}

function getHighlightClass(
  isSelected: boolean,
  isPeer: boolean,
  isSameNumber: boolean,
  isConflict: boolean
): string {
  if (isSelected) return "cell-selected";
  if (isConflict) return "cell-conflict";
  if (isSameNumber) return "cell-same-number";
  if (isPeer) return "cell-peer";
  return "";
}

function NotesGrid({ notes, selectedValue }: { notes: Set<number>; selectedValue: number }) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 w-full h-full" data-notes>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
        const isMatch = selectedValue > 0 && d === selectedValue && notes.has(d);
        return (
          <span
            key={d}
            className="flex items-center justify-center text-[9px] leading-none"
            style={{
              color: isMatch ? "var(--p-selected)" : "var(--p-text-muted)",
              fontWeight: isMatch ? 700 : 400,
            }}
            data-note-digit={d}
          >
            {notes.has(d) ? d : ""}
          </span>
        );
      })}
    </div>
  );
}

export default function Cell({
  value, isClue, row, col,
  isSelected = false, isPeer = false, isSameNumber = false, isConflict = false,
  notes,
  selectedValue = 0,
  onClick,
}: CellProps) {
  const borderClasses = getBorderClasses(row, col);
  const highlightClass = getHighlightClass(isSelected, isPeer, isSameNumber, isConflict);
  const bgColor = getHighlightBg(isClue, isSelected, isPeer, isSameNumber, isConflict);

  // Selected cell text should be white for contrast against bold selected bg
  const textColor = isSelected
    ? "#FFFFFF"
    : isConflict
      ? "var(--p-error)"
      : isSameNumber && value !== 0
        ? "var(--p-selected)"
        : isClue
          ? "var(--p-text)"
          : "var(--p-primary)";

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
      className={`flex items-center justify-center text-lg select-none transition-colors duration-150 cursor-pointer ${highlightClass} ${borderClasses}`}
      style={{
        background: bgColor,
        color: hasNotes ? undefined : textColor,
        fontWeight: isClue ? 700 : isSelected ? 700 : 400,
        borderColor: getBorderColor(row, col),
      }}
      onClick={() => onClick?.(row, col)}
    >
      {hasNotes ? <NotesGrid notes={notes} selectedValue={selectedValue} /> : value > 0 ? value : ""}
    </div>
  );
}
