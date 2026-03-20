import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./init";

export const leaderboardRouter = router({
  getLeaderboard: publicProcedure
    .input(
      z.object({
        difficulty: z.enum(["easy", "medium", "hard", "expert"]),
        view: z.enum(["all-time", "this-week"]).default("all-time"),
        friendsOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      // friendsOnly requires authentication
      if (input.friendsOnly && !ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Login required to use friends filter",
        });
      }

      // If friendsOnly, get the list of followed user IDs
      let friendIds: string[] | null = null;
      if (input.friendsOnly && ctx.session) {
        const { data: follows, error: followsErr } = await ctx.supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", ctx.session.user.id);

        if (followsErr) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: followsErr.message,
          });
        }

        friendIds = (follows ?? []).map((f) => f.following_id);
        if (friendIds.length === 0) {
          return { entries: [] };
        }
      }

      // Build query: daily games only, for the requested difficulty
      let query = ctx.supabase
        .from("games")
        .select("user_id, time_seconds, completed_at")
        .eq("is_daily", true)
        .eq("difficulty", input.difficulty);

      // "This week" filter: only games from the last 7 days
      if (input.view === "this-week") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte("completed_at", sevenDaysAgo.toISOString());
      }

      // Friends filter
      if (friendIds) {
        query = query.in("user_id", friendIds);
      }

      const { data: games, error: gamesErr } = await query;

      if (gamesErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: gamesErr.message,
        });
      }

      if (!games || games.length === 0) {
        return { entries: [] };
      }

      // Aggregate: best time and solve count per user
      const userMap = new Map<
        string,
        { bestTime: number; solveCount: number }
      >();
      for (const game of games) {
        const existing = userMap.get(game.user_id);
        if (existing) {
          existing.bestTime = Math.min(existing.bestTime, game.time_seconds);
          existing.solveCount += 1;
        } else {
          userMap.set(game.user_id, {
            bestTime: game.time_seconds,
            solveCount: 1,
          });
        }
      }

      // Fetch profiles for all users on the leaderboard
      const userIds = [...userMap.keys()];
      const { data: profiles } = await ctx.supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      // Build entries sorted by best time ascending
      const entries = userIds
        .map((userId) => {
          const stats = userMap.get(userId)!;
          const profile = profileMap.get(userId);
          return {
            rank: 0, // assigned below
            userId,
            username: profile?.username ?? "unknown",
            avatarUrl: profile?.avatar_url ?? null,
            bestTime: stats.bestTime,
            solveCount: stats.solveCount,
          };
        })
        .sort((a, b) => a.bestTime - b.bestTime);

      // Assign ranks
      for (let i = 0; i < entries.length; i++) {
        entries[i].rank = i + 1;
      }

      return { entries };
    }),
});
