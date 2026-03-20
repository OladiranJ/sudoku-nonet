import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./init";

export const feedRouter = router({
  getFeed: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      // Get list of followed user IDs
      const { data: follows, error: followsErr } = await ctx.supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId);

      if (followsErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: followsErr.message,
        });
      }

      if (!follows || follows.length === 0) {
        return { items: [], nextCursor: null };
      }

      const followedIds = follows.map((f) => f.following_id);

      // Query games from followed users
      let query = ctx.supabase
        .from("games")
        .select("id, user_id, difficulty, time_seconds, is_daily, completed_at")
        .in("user_id", followedIds)
        .order("completed_at", { ascending: false })
        .limit(input.limit + 1); // fetch one extra for cursor

      if (input.cursor) {
        query = query.lt("completed_at", input.cursor);
      }

      const { data: games, error: gamesErr } = await query;

      if (gamesErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: gamesErr.message,
        });
      }

      if (!games || games.length === 0) {
        return { items: [], nextCursor: null };
      }

      // Determine cursor
      let nextCursor: string | null = null;
      const items = games.slice(0, input.limit);
      if (games.length > input.limit) {
        nextCursor = items[items.length - 1].completed_at;
      }

      // Fetch profile data for the users in these games
      const userIds = [...new Set(items.map((g) => g.user_id))];
      const { data: profiles } = await ctx.supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      const feedItems = items.map((g) => {
        const profile = profileMap.get(g.user_id);
        return {
          id: g.id,
          username: profile?.username ?? "unknown",
          avatar_url: profile?.avatar_url ?? null,
          difficulty: g.difficulty,
          time_seconds: g.time_seconds,
          is_daily: g.is_daily,
          completed_at: g.completed_at,
        };
      });

      return { items: feedItems, nextCursor };
    }),
});
