import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "./init";

export const adminRouter = router({
  /**
   * Return all registered users with their game count. Admin only.
   */
  getUserList: adminProcedure.query(async ({ ctx }) => {
    const [profilesRes, gamesRes] = await Promise.all([
      ctx.supabase
        .from("profiles")
        .select("id, username, created_at")
        .order("created_at", { ascending: false }),
      ctx.supabase
        .from("games")
        .select("user_id"),
    ]);

    if (profilesRes.error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: profilesRes.error.message,
      });
    }

    const counts = new Map<string, number>();
    for (const g of gamesRes.data ?? []) {
      counts.set(g.user_id, (counts.get(g.user_id) ?? 0) + 1);
    }

    return (profilesRes.data ?? []).map((p) => ({
      id: p.id,
      username: p.username,
      created_at: p.created_at,
      game_count: counts.get(p.id) ?? 0,
    }));
  }),
});
