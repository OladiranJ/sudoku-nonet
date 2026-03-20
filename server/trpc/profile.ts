import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./init";

type DifficultyStats = {
  difficulty: string;
  solved: number;
  bestTime: number | null;
  avgTime: number | null;
};

export const profileRouter = router({
  getByUsername: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, created_at")
        .eq("username", input.username)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }

      return data;
    }),

  getStats: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("games")
        .select("difficulty, time_seconds")
        .eq("user_id", input.userId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const statsMap = new Map<string, { times: number[] }>();
      for (const game of data || []) {
        const entry = statsMap.get(game.difficulty) || { times: [] };
        entry.times.push(game.time_seconds);
        statsMap.set(game.difficulty, entry);
      }

      const difficulties = ["easy", "medium", "hard", "expert"];
      const stats: DifficultyStats[] = difficulties.map((d) => {
        const entry = statsMap.get(d);
        if (!entry || entry.times.length === 0) {
          return { difficulty: d, solved: 0, bestTime: null, avgTime: null };
        }
        const solved = entry.times.length;
        const bestTime = Math.min(...entry.times);
        const avgTime = Math.round(
          entry.times.reduce((a, b) => a + b, 0) / solved
        );
        return { difficulty: d, solved, bestTime, avgTime };
      });

      return stats;
    }),

  getRecentActivity: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("games")
        .select("id, difficulty, time_seconds, is_daily, completed_at")
        .eq("user_id", input.userId)
        .order("completed_at", { ascending: false })
        .limit(10);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data || [];
    }),

  getFollowCounts: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [followersRes, followingRes] = await Promise.all([
        ctx.supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", input.userId),
        ctx.supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", input.userId),
      ]);

      return {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      };
    }),

  getAchievements: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("achievements")
        .select("badge_id, earned_at")
        .eq("user_id", input.userId)
        .order("earned_at", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data || [];
    }),
});
