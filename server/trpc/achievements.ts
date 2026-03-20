import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./init";
import { VALID_BADGE_IDS, getBadgeById } from "@/lib/achievements/badges";

export const achievementRouter = router({
  /**
   * Grant an achievement to the current user.
   * Uses upsert to gracefully handle duplicates (unique constraint on user_id + badge_id).
   * Creates an "achievement" notification on first grant.
   */
  grantAchievement: protectedProcedure
    .input(z.object({ badgeId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Validate badge ID
      if (!VALID_BADGE_IDS.has(input.badgeId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown badge: ${input.badgeId}`,
        });
      }

      // Check if already earned
      const { data: existing } = await ctx.supabase
        .from("achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("badge_id", input.badgeId)
        .limit(1);

      if (existing && existing.length > 0) {
        return { granted: false, alreadyEarned: true };
      }

      // Insert the achievement
      const { error } = await ctx.supabase.from("achievements").insert({
        user_id: userId,
        badge_id: input.badgeId,
      });

      if (error) {
        // Handle race condition — another request may have inserted between check and insert
        if (error.code === "23505") {
          return { granted: false, alreadyEarned: true };
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Create notification for the user
      const badge = getBadgeById(input.badgeId);
      await ctx.supabase.from("notifications").insert({
        user_id: userId,
        type: "achievement",
        payload: {
          badge_id: input.badgeId,
          badge_name: badge?.name ?? input.badgeId,
          badge_description: badge?.description ?? "",
        },
      });

      return { granted: true, alreadyEarned: false };
    }),

  /**
   * Get all achievements for the current user.
   */
  getMyAchievements: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const { data, error } = await ctx.supabase
      .from("achievements")
      .select("badge_id, earned_at")
      .eq("user_id", userId)
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
