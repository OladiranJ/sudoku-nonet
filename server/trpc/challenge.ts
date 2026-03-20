import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./init";

export const challengeRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        challengedId: z.string().uuid(),
        puzzleSeed: z.string().min(1),
        difficulty: z.enum(["easy", "medium", "hard", "expert"]),
        challengerTime: z.number().int().positive(),
        isDaily: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      if (input.isDaily) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Daily puzzles cannot be used for challenges",
        });
      }

      if (input.challengedId === currentUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot challenge yourself",
        });
      }

      const { data, error } = await ctx.supabase
        .from("challenges")
        .insert({
          challenger_id: currentUserId,
          challenged_id: input.challengedId,
          puzzle_seed: input.puzzleSeed,
          difficulty: input.difficulty,
          status: "pending",
          challenger_time: input.challengerTime,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Get challenger username for notification
      const { data: profile } = await ctx.supabase
        .from("profiles")
        .select("username")
        .eq("id", currentUserId)
        .single();

      // Create notification for challenged user
      await ctx.supabase.from("notifications").insert({
        user_id: input.challengedId,
        type: "challenge_received",
        payload: {
          challenge_id: data.id,
          challenger_username: profile?.username ?? "unknown",
          difficulty: input.difficulty,
        },
      });

      return data;
    }),

  complete: protectedProcedure
    .input(
      z.object({
        challengeId: z.string().uuid(),
        time: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      // Fetch challenge
      const { data: challenge, error: fetchErr } = await ctx.supabase
        .from("challenges")
        .select("*")
        .eq("id", input.challengeId)
        .single();

      if (fetchErr || !challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      if (challenge.challenged_id !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not the challenged user",
        });
      }

      if (challenge.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge is not pending",
        });
      }

      // Update challenge
      const { data: updated, error: updateErr } = await ctx.supabase
        .from("challenges")
        .update({
          challenged_time: input.time,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", input.challengeId)
        .select()
        .single();

      if (updateErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateErr.message,
        });
      }

      // Determine winner
      const challengerTime = challenge.challenger_time;
      const winner =
        input.time < challengerTime
          ? "challenged"
          : input.time > challengerTime
            ? "challenger"
            : "tie";

      // Get challenged username for notification
      const { data: profile } = await ctx.supabase
        .from("profiles")
        .select("username")
        .eq("id", currentUserId)
        .single();

      // Notify challenger of result
      await ctx.supabase.from("notifications").insert({
        user_id: challenge.challenger_id,
        type: "challenge_result",
        payload: {
          challenge_id: challenge.id,
          challenged_username: profile?.username ?? "unknown",
          winner,
          challenger_time: challengerTime,
          challenged_time: input.time,
        },
      });

      return { ...updated, winner };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      const { data: challenge, error } = await ctx.supabase
        .from("challenges")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error || !challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      // Only participants can view
      if (
        challenge.challenger_id !== currentUserId &&
        challenge.challenged_id !== currentUserId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a participant in this challenge",
        });
      }

      // Fetch both profiles
      const { data: profiles } = await ctx.supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", [challenge.challenger_id, challenge.challenged_id]);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      const winner =
        challenge.status === "completed" &&
        challenge.challenger_time != null &&
        challenge.challenged_time != null
          ? challenge.challenged_time < challenge.challenger_time
            ? "challenged"
            : challenge.challenged_time > challenge.challenger_time
              ? "challenger"
              : "tie"
          : null;

      return {
        ...challenge,
        challenger: profileMap.get(challenge.challenger_id) ?? null,
        challenged: profileMap.get(challenge.challenged_id) ?? null,
        winner,
      };
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const currentUserId = ctx.session.user.id;

    const { data, error } = await ctx.supabase
      .from("challenges")
      .select("*")
      .or(`challenger_id.eq.${currentUserId},challenged_id.eq.${currentUserId}`)
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
});
