"use client";

import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  expert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function FeedPage() {
  const feedQuery = trpc.feed.getFeed.useQuery({ limit: 20 });

  const items = feedQuery.data?.items ?? [];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="feed-page">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <Link
          href="/"
          className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
        >
          &larr; Back to Nonet
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4 mb-6">
          Friend Activity
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {feedQuery.isLoading ? (
          <div className="flex justify-center py-8" data-testid="feed-loading">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12" data-testid="feed-empty">
            <p className="text-slate-500 dark:text-slate-400">
              Follow some players to see their activity here.
            </p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="feed-list">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3"
                data-testid="feed-item"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={`/u/${item.username}`}
                    className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors truncate"
                  >
                    {item.username}
                  </Link>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${DIFFICULTY_COLORS[item.difficulty] ?? ""}`}
                  >
                    {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 shrink-0">
                    {formatTime(item.time_seconds)}
                  </span>
                  {item.is_daily && (
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-medium shrink-0">
                      Daily
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                  {formatRelativeTime(item.completed_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
