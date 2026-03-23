import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./init";

export const resultRouter = router({
  getResult: publicProcedure
    .input(z.object({ gameId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: game, error: gameErr } = await ctx.supabase
        .from("games")
        .select(
          "id, user_id, difficulty, time_seconds, error_count, hint_count, is_daily, puzzle_date, completed_at"
        )
        .eq("id", input.gameId)
        .single();

      if (gameErr || !game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      let username = "Anonymous";
      let avatarUrl: string | null = null;

      if (game.user_id) {
        const { data: profile } = await ctx.supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", game.user_id)
          .single();

        if (profile) {
          username = profile.username;
          avatarUrl = profile.avatar_url;
        }
      }

      return {
        id: game.id,
        difficulty: game.difficulty,
        time_seconds: game.time_seconds,
        error_count: game.error_count,
        hint_count: game.hint_count,
        is_daily: game.is_daily,
        puzzle_date: game.puzzle_date,
        completed_at: game.completed_at,
        username,
        avatarUrl,
      };
    }),
});
