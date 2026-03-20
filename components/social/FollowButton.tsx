"use client";

import { trpc } from "@/lib/trpc/client";

interface FollowButtonProps {
  userId: string;
}

export default function FollowButton({ userId }: FollowButtonProps) {
  const isFollowingQuery = trpc.follow.isFollowing.useQuery({ userId });
  const utils = trpc.useUtils();

  const followMutation = trpc.follow.follow.useMutation({
    onSuccess: () => {
      utils.follow.isFollowing.invalidate({ userId });
      utils.profile.getFollowCounts.invalidate({ userId });
    },
  });

  const unfollowMutation = trpc.follow.unfollow.useMutation({
    onSuccess: () => {
      utils.follow.isFollowing.invalidate({ userId });
      utils.profile.getFollowCounts.invalidate({ userId });
    },
  });

  const isFollowing = isFollowingQuery.data?.following ?? false;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate({ userId });
    } else {
      followMutation.mutate({ userId });
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending || isFollowingQuery.isLoading}
      data-testid="follow-button"
      data-following={isFollowing}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800 active:bg-red-100 dark:active:bg-red-900/30"
          : "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800"
      }`}
    >
      {isPending ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
