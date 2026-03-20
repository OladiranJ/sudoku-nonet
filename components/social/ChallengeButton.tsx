"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

interface ChallengeButtonProps {
  puzzleSeed: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  challengerTime: number;
  onChallengeCreated?: (challengeId: string) => void;
}

export default function ChallengeButton({
  puzzleSeed,
  difficulty,
  challengerTime,
  onChallengeCreated,
}: ChallengeButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState("");

  const followingQuery = trpc.follow.getFollowing.useQuery(undefined, {
    enabled: showPicker,
  });

  const createMutation = trpc.challenge.create.useMutation({
    onSuccess: (data) => {
      setShowPicker(false);
      onChallengeCreated?.(data.id);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleChallenge = (userId: string) => {
    setError("");
    createMutation.mutate({
      challengedId: userId,
      puzzleSeed,
      difficulty,
      challengerTime,
      isDaily: false,
    });
  };

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="w-full py-2.5 px-4 rounded-md border border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 active:bg-brand-100 dark:active:bg-brand-900/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
        data-testid="challenge-friend-button"
      >
        Challenge a Friend
      </button>
    );
  }

  const following = followingQuery.data ?? [];

  return (
    <div className="space-y-2" data-testid="challenge-picker">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Choose a friend to challenge:
      </p>
      {followingQuery.isLoading ? (
        <div className="flex justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        </div>
      ) : following.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Follow some players first to challenge them.
        </p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {following.map((user) => (
            <button
              key={user.userId}
              onClick={() => handleChallenge(user.userId)}
              disabled={createMutation.isPending}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors text-sm font-medium text-slate-900 dark:text-slate-100 disabled:opacity-50"
              data-testid={`challenge-user-${user.username}`}
            >
              {user.username}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-500" data-testid="challenge-error">{error}</p>
      )}
      <button
        onClick={() => { setShowPicker(false); setError(""); }}
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        data-testid="challenge-cancel"
      >
        Cancel
      </button>
    </div>
  );
}
