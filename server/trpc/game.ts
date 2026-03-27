import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./init";
import { gameRateLimit } from "@/server/middleware/rateLimit";

const submitGameInput = z
  .object({
    seed: z.string().min(1),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]),
    time_seconds: z.number().int().positive(),
    error_count: z.number().int().min(0),
    hint_count: z.number().int().min(0),
    is_daily: z.boolean(),
    puzzle_date: z.string().nullable(),
  })
  .refine(
    (data) => !data.is_daily || (data.puzzle_date !== null && data.puzzle_date.length > 0),
    { message: "puzzle_date is required for daily puzzles", path: ["puzzle_date"] }
  );

export const gameRouter = router({
  submitGame: protectedProcedure
    .use(gameRateLimit)
    .input(submitGameInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Reject duplicate daily submission for same user + date + difficulty
      if (input.is_daily) {
        const { data: existing } = await ctx.supabase
          .from("games")
          .select("id")
          .eq("user_id", userId)
          .eq("is_daily", true)
          .eq("puzzle_date", input.puzzle_date)
          .eq("difficulty", input.difficulty)
          .limit(1);

        if (existing && existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Daily puzzle already submitted for this date and difficulty",
          });
        }
      }

      const { data, error } = await ctx.supabase
        .from("games")
        .insert({
          user_id: userId,
          puzzle_seed: input.seed,
          difficulty: input.difficulty,
          time_seconds: input.time_seconds,
          error_count: input.error_count,
          hint_count: input.hint_count,
          is_daily: input.is_daily,
          puzzle_date: input.puzzle_date,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),
});
