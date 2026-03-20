import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./init";

export const followRouter = router({
  follow: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      if (input.userId === currentUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot follow yourself",
        });
      }

      // Check if already following
      const { data: existing } = await ctx.supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", currentUserId)
        .eq("following_id", input.userId)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: true, alreadyFollowing: true };
      }

      // Insert follow
      const { error } = await ctx.supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: input.userId,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Get current user's username for notification payload
      const { data: profile } = await ctx.supabase
        .from("profiles")
        .select("username")
        .eq("id", currentUserId)
        .single();

      // Create notification for followed user
      await ctx.supabase.from("notifications").insert({
        user_id: input.userId,
        type: "follow",
        payload: {
          follower_id: currentUserId,
          follower_username: profile?.username ?? "unknown",
        },
      });

      return { success: true, alreadyFollowing: false };
    }),

  unfollow: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      const { error } = await ctx.supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", input.userId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),

  isFollowing: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      const { data } = await ctx.supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", currentUserId)
        .eq("following_id", input.userId)
        .limit(1);

      return { following: !!data && data.length > 0 };
    }),

  getFollowing: protectedProcedure.query(async ({ ctx }) => {
    const currentUserId = ctx.session.user.id;

    const { data, error } = await ctx.supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    if (!data || data.length === 0) return [];

    const userIds = data.map((f) => f.following_id);

    const { data: profiles } = await ctx.supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    return (profiles ?? []).map((p) => ({
      userId: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
    }));
  }),
});
