"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

const BADGE_LABELS: Record<string, string> = {
  first_solve: "First Solve",
  speed_demon: "Speed Demon",
  expert_mind: "Expert Mind",
  clean_sheet: "Clean Sheet",
  hint_free: "Hint-Free",
  social_butterfly: "Social Butterfly",
  challenger: "Challenger",
};

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

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const profileQuery = trpc.profile.getByUsername.useQuery(
    { username },
    { enabled: !!username, retry: false }
  );

  const userId = profileQuery.data?.id;

  const statsQuery = trpc.profile.getStats.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  const activityQuery = trpc.profile.getRecentActivity.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  const followCountsQuery = trpc.profile.getFollowCounts.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  const achievementsQuery = trpc.profile.getAchievements.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  // Loading state
  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="profile-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  // Error / not found
  if (profileQuery.error || !profileQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="profile-not-found">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            User not found
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            No profile found for &quot;{username}&quot;.
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

  const profile = profileQuery.data;
  const stats = statsQuery.data ?? [];
  const activity = activityQuery.data ?? [];
  const followCounts = followCountsQuery.data ?? { followers: 0, following: 0 };
  const achievements = achievementsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="profile-page">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <Link
          href="/"
          className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
        >
          &larr; Back to Nonet
        </Link>
      </div>

      {/* Profile Header */}
      <div className="max-w-2xl mx-auto px-4 pb-6" data-testid="profile-header">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-2xl font-bold text-brand-600 dark:text-brand-400 overflow-hidden shrink-0"
            data-testid="profile-avatar"
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              profile.username.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h1
              className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate"
              data-testid="profile-username"
            >
              {profile.username}
            </h1>
            {profile.display_name && (
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate" data-testid="profile-display-name">
                {profile.display_name}
              </p>
            )}
          </div>
        </div>

        {/* Follow Counts */}
        <div className="flex gap-4 mt-4" data-testid="follow-counts">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100" data-testid="follower-count">
              {followCounts.followers}
            </span>{" "}
            followers
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100" data-testid="following-count">
              {followCounts.following}
            </span>{" "}
            following
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-2xl mx-auto px-4 pb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="stats-grid">
          {stats.map((s) => (
            <div
              key={s.difficulty}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm"
              data-testid={`stats-${s.difficulty}`}
            >
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${DIFFICULTY_COLORS[s.difficulty] ?? ""}`}
              >
                {s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1)}
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {s.solved}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">solved</div>
              {s.bestTime !== null && (
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Best: <span className="font-medium">{formatTime(s.bestTime)}</span>
                </div>
              )}
              {s.avgTime !== null && (
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Avg: <span className="font-medium">{formatTime(s.avgTime)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="max-w-2xl mx-auto px-4 pb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Recent Activity
        </h2>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No games played yet.</p>
        ) : (
          <div className="space-y-2" data-testid="activity-list">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3"
                data-testid="activity-item"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[item.difficulty] ?? ""}`}
                  >
                    {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatTime(item.time_seconds)}
                  </span>
                  {item.is_daily && (
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                      Daily
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatRelativeTime(item.completed_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Badges</h2>
        {achievements.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No badges earned yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2" data-testid="badges-list">
            {achievements.map((a) => (
              <span
                key={a.badge_id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-sm font-medium border border-brand-200 dark:border-brand-800"
                data-testid={`badge-${a.badge_id}`}
              >
                {BADGE_LABELS[a.badge_id] ?? a.badge_id}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
