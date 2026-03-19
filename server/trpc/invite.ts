import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "./init";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a random invite code in the format "xxxx-xxxx". */
function generateInviteCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/** Derive status from an invite row. */
function deriveStatus(row: {
  used_by: string | null;
  expires_at: string;
}): "used" | "expired" | "pending" {
  if (row.used_by) return "used";
  if (new Date(row.expires_at) < new Date()) return "expired";
  return "pending";
}

// ---------------------------------------------------------------------------
// Invite Router
// ---------------------------------------------------------------------------

export const inviteRouter = router({
  /**
   * Generate a new single-use invite code. Admin only.
   * Code expires 24 hours after creation.
   */
  generate: adminProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const code = generateInviteCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await ctx.supabase
      .from("invites")
      .insert({
        code,
        created_by: userId,
        expires_at: expiresAt,
      })
      .select("id, code, expires_at")
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return { id: data.id, code: data.code, expiresAt: data.expires_at };
  }),

  /**
   * List all invites, ordered by most recent first. Admin only.
   */
  list: adminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("invites")
      .select("id, code, created_at, expires_at, used_by, used_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return (data ?? []).map((row) => ({
      ...row,
      status: deriveStatus(row),
    }));
  }),

  /**
   * Revoke (delete) an unused invite. Admin only.
   * Already-used invites cannot be revoked.
   */
  revoke: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the invite exists and whether it's been used
      const { data: invite, error: fetchErr } = await ctx.supabase
        .from("invites")
        .select("id, used_by")
        .eq("id", input.id)
        .single();

      if (fetchErr || !invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }

      if (invite.used_by) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot revoke an already-used invite",
        });
      }

      const { error: deleteErr } = await ctx.supabase
        .from("invites")
        .delete()
        .eq("id", input.id);

      if (deleteErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: deleteErr.message,
        });
      }

      return { success: true };
    }),
});
