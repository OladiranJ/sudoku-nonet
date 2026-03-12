"use client";

import { useGameStore } from "@/lib/store/gameStore";

export default function ErrorCounter() {
  const errorCount = useGameStore((s) => s.errorCount);

  return (
    <div data-testid="error-counter" className="text-sm font-medium">
      Errors: <span data-testid="error-count">{errorCount}</span>
    </div>
  );
}
