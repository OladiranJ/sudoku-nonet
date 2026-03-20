"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  expert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function ChallengePage() {
  const params = useParams<{ id: string }>();
  const challengeQuery = trpc.challenge.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id, retry: false }
  );

  if (challengeQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="challenge-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (challengeQuery.error || !challengeQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="challenge-not-found">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Challenge not found
          </h2>
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

  const challenge = challengeQuery.data;
  const isCompleted = challenge.status === "completed";
  const diffLabel =
    challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="challenge-page">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
        <Link
          href="/"
          className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
        >
          &larr; Back to Nonet
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6">
          {/* Title */}
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-1">
            Challenge
          </h1>
          <div className="flex justify-center mb-6">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_COLORS[challenge.difficulty] ?? ""}`}
            >
              {diffLabel}
            </span>
          </div>

          {/* Players */}
          <div className="flex items-center justify-between gap-4" data-testid="challenge-players">
            {/* Challenger */}
            <div className="flex-1 text-center" data-testid="challenger-card">
              <Link
                href={`/u/${challenge.challenger?.username ?? ""}`}
                className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              >
                {challenge.challenger?.username ?? "Unknown"}
              </Link>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {challenge.challenger_time != null
                  ? formatTime(challenge.challenger_time)
                  : "—"}
              </div>
              {isCompleted && challenge.winner === "challenger" && (
                <span className="inline-block mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400" data-testid="winner-badge">
                  Winner
                </span>
              )}
            </div>

            {/* VS */}
            <div className="text-lg font-bold text-slate-400 dark:text-slate-600">vs</div>

            {/* Challenged */}
            <div className="flex-1 text-center" data-testid="challenged-card">
              <Link
                href={`/u/${challenge.challenged?.username ?? ""}`}
                className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              >
                {challenge.challenged?.username ?? "Unknown"}
              </Link>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {challenge.challenged_time != null
                  ? formatTime(challenge.challenged_time)
                  : "Pending"}
              </div>
              {isCompleted && challenge.winner === "challenged" && (
                <span className="inline-block mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400" data-testid="winner-badge">
                  Winner
                </span>
              )}
            </div>
          </div>

          {/* Tie */}
          {isCompleted && challenge.winner === "tie" && (
            <div className="text-center mt-4" data-testid="tie-badge">
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                It&apos;s a tie!
              </span>
            </div>
          )}

          {/* Status */}
          {!isCompleted && (
            <div className="text-center mt-6" data-testid="challenge-pending">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Waiting for {challenge.challenged?.username ?? "opponent"} to complete the challenge.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
