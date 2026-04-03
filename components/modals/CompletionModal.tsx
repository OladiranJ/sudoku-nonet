"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useGameStore } from "@/lib/store/gameStore";
import { useTimerStore } from "@/lib/store/timerStore";
import { formatTime } from "@/lib/store/dailyStore";
import ChallengeButton from "@/components/social/ChallengeButton";

interface CompletionModalProps {
  isOpen: boolean;
  isGuest?: boolean;
  gameId?: string | null;
  onClose: () => void;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export default function CompletionModal({
  isOpen,
  isGuest = true,
  gameId,
  onClose,
  onPlayAgain,
  onNewGame,
}: CompletionModalProps) {
  const difficulty = useGameStore((s) => s.difficulty);
  const errorCount = useGameStore((s) => s.errorCount);
  const hintCount = useGameStore((s) => s.hintCount);
  const isDaily = useGameStore((s) => s.isDaily);
  const seed = useGameStore((s) => s.seed);
  const elapsed = useTimerStore((s) => s.elapsed);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const difficultyLabel = difficulty
    ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      data-testid="completion-modal"
    >
      <div
        className="rounded-xl p-6 w-full max-w-sm mx-4 text-center"
        style={{
          background: "var(--p-cell)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.15), 0 0 0 1px var(--p-grid)",
          color: "var(--p-text)",
        }}
      >
        <h2 className="text-2xl font-bold mb-2">Puzzle Complete!</h2>

        <span
          className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
          style={{
            background: isDaily ? "var(--p-primary-soft)" : "var(--p-secondary)",
            color: isDaily ? "var(--p-primary)" : "var(--p-text)",
            border: `1px solid ${isDaily ? "var(--p-primary-hover)" : "var(--p-grid)"}`,
          }}
          data-testid="puzzle-badge"
        >
          {isDaily ? "Daily" : "Random"}
        </span>

        <div className="flex flex-col gap-2 mb-6 text-left">
          {[
            { label: "Difficulty", value: difficultyLabel, testId: "stat-difficulty" },
            { label: "Time", value: formatTime(elapsed), testId: "stat-time" },
            { label: "Errors", value: String(errorCount), testId: "stat-errors" },
            { label: "Hints", value: String(hintCount), testId: "stat-hints" },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              className="flex justify-between py-2"
              style={{
                borderBottom: i < arr.length - 1 ? "1px solid var(--p-grid)" : "none",
              }}
            >
              <span style={{ color: "var(--p-text-muted)" }}>{stat.label}</span>
              <span className="font-medium" data-testid={stat.testId}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {isGuest && (
          <div
            className="mb-4 p-3 rounded-lg"
            style={{
              background: "var(--p-primary-soft)",
              border: "1px solid var(--p-primary-hover)",
            }}
            data-testid="guest-cta"
          >
            <p className="text-sm font-medium" style={{ color: "var(--p-primary)" }}>
              Save your stats — create a free account
            </p>
            <a
              href="/invite"
              className="inline-block mt-1 text-sm underline"
              style={{ color: "var(--p-primary)" }}
            >
              Sign up now
            </a>
          </div>
        )}

        {/* Challenge a Friend — only for random puzzles by logged-in users */}
        {!isGuest && !isDaily && seed && difficulty && (
          <div className="mb-4" data-testid="challenge-section">
            <ChallengeButton
              puzzleSeed={seed}
              difficulty={difficulty as "easy" | "medium" | "hard" | "expert"}
              challengerTime={elapsed}
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-4 rounded-lg font-medium transition-colors duration-150 cursor-pointer"
            style={{
              background: "var(--p-primary)",
              color: "var(--p-cell)",
            }}
            data-action="play-again"
          >
            Play Again
          </button>
          <button
            onClick={onNewGame}
            className="w-full py-3 px-4 rounded-lg font-medium transition-colors duration-150 cursor-pointer"
            style={{
              border: "1px solid var(--p-grid)",
              color: "var(--p-text)",
              background: "transparent",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--p-primary-soft)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            data-action="new-game"
          >
            New Game
          </button>
          <button
            onClick={async () => {
              if (gameId) {
                const url = `${window.location.origin}/result/${gameId}`;
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: "Nonet \u2014 Puzzle Result",
                      text: "Check out my Sudoku result on Nonet!",
                      url,
                    });
                    return;
                  } catch {
                    // User cancelled — fall through to copy
                  }
                }
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  // Fallback
                  const input = document.createElement("input");
                  input.value = url;
                  document.body.appendChild(input);
                  input.select();
                  document.execCommand("copy");
                  document.body.removeChild(input);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              } else {
                onClose();
              }
            }}
            className="w-full py-2 px-4 text-sm cursor-pointer"
            style={{ color: "var(--p-text-muted)" }}
            data-action="share"
          >
            {copied ? "Link Copied!" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
