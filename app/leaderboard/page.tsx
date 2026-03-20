"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700",
  hard: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700",
  expert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700",
};

const DIFFICULTY_ACTIVE: Record<string, string> = {
  easy: "bg-emerald-600 text-white dark:bg-emerald-500",
  medium: "bg-amber-600 text-white dark:bg-amber-500",
  hard: "bg-orange-600 text-white dark:bg-orange-500",
  expert: "bg-red-600 text-white dark:bg-red-500",
};

type View = "all-time" | "this-week";

export default function LeaderboardPage() {
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("easy");
  const [view, setView] = useState<View>("all-time");
  const [friendsOnly, setFriendsOnly] = useState(false);

  const leaderboardQuery = trpc.leaderboard.getLeaderboard.useQuery({
    difficulty,
    view,
    friendsOnly,
  });

  const entries = leaderboardQuery.data?.entries ?? [];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="leaderboard-page">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <Link
          href="/"
          className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors duration-150"
        >
          &larr; Back to Nonet
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4 mb-6">
          Leaderboard
        </h1>

        {/* Difficulty tabs */}
        <div className="flex gap-2 mb-4" data-testid="difficulty-tabs">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              data-testid={`tab-${d}`}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95 ${
                difficulty === d
                  ? DIFFICULTY_ACTIVE[d]
                  : DIFFICULTY_COLORS[d]
              }`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* View toggle + friends filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5" data-testid="view-toggle">
            <button
              data-testid="view-all-time"
              onClick={() => setView("all-time")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-slate-400 ${
                view === "all-time"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              All-time
            </button>
            <button
              data-testid="view-this-week"
              onClick={() => setView("this-week")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-slate-400 ${
                view === "this-week"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              This week
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              data-testid="friends-filter"
              checked={friendsOnly}
              onChange={(e) => setFriendsOnly(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Friends only</span>
          </label>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        {leaderboardQuery.isLoading ? (
          <div className="flex justify-center py-8" data-testid="leaderboard-loading">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12" data-testid="leaderboard-empty">
            <p className="text-slate-500 dark:text-slate-400">
              No results yet. Be the first to complete a daily puzzle!
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden" data-testid="leaderboard-table">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3 text-right">Best Time</th>
                  <th className="px-4 py-3 text-right">Solved</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.userId}
                    data-testid="leaderboard-entry"
                    className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-slate-400 dark:text-slate-500" data-testid="entry-rank">
                      {entry.rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/u/${entry.username}`}
                        className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors duration-150"
                        data-testid="entry-username"
                      >
                        {entry.username}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100" data-testid="entry-best-time">
                      {formatTime(entry.bestTime)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400" data-testid="entry-solve-count">
                      {entry.solveCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
