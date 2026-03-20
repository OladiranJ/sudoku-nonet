import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./init";

export const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const { data, error } = await ctx.supabase
      .from("notifications")
      .select("id, type, payload, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return data ?? [];
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const { count, error } = await ctx.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return { count: count ?? 0 };
  }),

  markAsRead: protectedProcedure
    .input(
      z.union([
        z.object({ ids: z.array(z.string().uuid()).min(1), all: z.undefined().optional() }),
        z.object({ all: z.literal(true), ids: z.undefined().optional() }),
      ])
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      let query = ctx.supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

      if ("ids" in input && input.ids) {
        query = query.in("id", input.ids);
      }

      const { error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),
});
