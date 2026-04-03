"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  expert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ResultPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const [copied, setCopied] = useState(false);

  const resultQuery = trpc.result.getResult.useQuery(
    { gameId },
    { enabled: !!gameId, retry: false }
  );

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/result/${gameId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text from a temporary input
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/result/${gameId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Nonet — Puzzle Result",
          text: `Check out my Sudoku result on Nonet!`,
          url,
        });
      } catch {
        // User cancelled or share failed — fall back to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Loading state
  if (resultQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="result-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  // Error / not found
  if (resultQuery.error || !resultQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="result-not-found">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Result not found
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            This game result doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const result = resultQuery.data;
  const difficultyLabel =
    result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="result-page">
      {/* Back link */}
      <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
        <Link
          href="/"
          className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
        >
          &larr; Back to Nonet
        </Link>
      </div>

      {/* Result card */}
      <div className="max-w-lg mx-auto px-4 pb-12">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-6 pt-6 pb-4 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              Puzzle Complete
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              by{" "}
              <Link
                href={`/u/${result.username}`}
                className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                data-testid="result-username"
              >
                {result.username}
              </Link>
            </p>
          </div>

          {/* Badges */}
          <div className="flex justify-center gap-2 pb-4">
            <span
              className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${DIFFICULTY_COLORS[result.difficulty] ?? ""}`}
              data-testid="result-difficulty"
            >
              {difficultyLabel}
            </span>
            <span
              className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                result.is_daily
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                  : "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
              }`}
              data-testid="result-type-badge"
            >
              {result.is_daily ? "Daily" : "Random"}
            </span>
          </div>

          {/* Stats */}
          <div className="px-6 pb-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Time</span>
                <span className="font-medium text-slate-900 dark:text-slate-100" data-testid="result-time">
                  {formatTime(result.time_seconds)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Errors</span>
                <span className="font-medium text-slate-900 dark:text-slate-100" data-testid="result-errors">
                  {result.error_count}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Hints</span>
                <span className="font-medium text-slate-900 dark:text-slate-100" data-testid="result-hints">
                  {result.hint_count}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2.5 px-4 rounded-md border border-slate-200 dark:border-slate-700 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 transition-colors"
              data-testid="copy-link-button"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={handleShare}
                className="flex-1 py-2.5 px-4 rounded-md bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 transition-colors"
                data-testid="share-button"
              >
                Share
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
