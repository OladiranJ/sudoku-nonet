import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { router, publicProcedure } from "@/server/trpc/init";
import { authRateLimit, inviteRateLimit } from "@/server/middleware/rateLimit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function validateInviteCode(supabase: SupabaseClient, code: string) {
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("code", code)
    .is("used_by", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid, expired, or already-used invite code",
    });
  }
  return data;
}

async function checkUsernameAvailable(supabase: SupabaseClient, username: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .limit(1);

  if (data && data.length > 0) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Username already taken",
    });
  }
}

/**
 * Create a Supabase client with the anon key for user-facing auth operations
 * (signInWithPassword, signInWithOAuth) that need to respect normal auth flow.
 */
function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Shared input schemas
// ---------------------------------------------------------------------------

const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores");

// ---------------------------------------------------------------------------
// Auth Router
// ---------------------------------------------------------------------------

export const authRouter = router({
  /**
   * Sign up with email + password. Requires a valid invite code.
   * Creates the auth user (via admin API), profile, and marks the invite used.
   */
  signUp: publicProcedure
    .use(authRateLimit)
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        inviteCode: z.string().min(1),
        username: usernameSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx; // service role client

      // 1. Validate invite code
      const invite = await validateInviteCode(supabase, input.inviteCode);

      // 2. Check username availability
      await checkUsernameAvailable(supabase, input.username);

      // 3. Create auth user via admin API (works even with public sign-up disabled)
      const { data: createData, error: createErr } =
        await supabase.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
        });

      if (createErr) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: createErr.message,
        });
      }

      const userId = createData.user.id;

      // 4. Create profile
      const { error: profileErr } = await supabase.from("profiles").insert({
        id: userId,
        username: input.username,
      });

      if (profileErr) {
        // Rollback: delete the auth user we just created
        await supabase.auth.admin.deleteUser(userId);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: profileErr.message,
        });
      }

      // 5. Mark invite as used
      await supabase
        .from("invites")
        .update({ used_by: userId, used_at: new Date().toISOString() })
        .eq("id", invite.id);

      // 6. Sign in to obtain a session
      const anon = createAnonClient();
      const { data: signInData, error: signInErr } =
        await anon.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

      if (signInErr || !signInData.session) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Account created but sign-in failed",
        });
      }

      return {
        user: signInData.user,
        session: signInData.session,
      };
    }),

  /**
   * Sign in with email + password. Returns a session.
   */
  login: publicProcedure
    .use(authRateLimit)
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const anon = createAnonClient();
      const { data, error } = await anon.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error || !data.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      return {
        user: data.user,
        session: data.session,
      };
    }),

  /**
   * Check whether an invite code is valid (not used, not expired).
   */
  validateInvite: publicProcedure
    .use(inviteRateLimit)
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from("invites")
        .select("expires_at")
        .eq("code", input.code)
        .is("used_by", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!data) {
        return { valid: false as const, expiresAt: null };
      }
      return { valid: true as const, expiresAt: data.expires_at as string };
    }),

  /**
   * Generate an OAuth authorization URL for sign-up.
   * Validates invite and username first, then encodes them in the redirect URL.
   */
  getOAuthUrl: publicProcedure
    .use(authRateLimit)
    .input(
      z.object({
        inviteCode: z.string().min(1),
        provider: z.enum(["google", "apple"]),
        username: usernameSchema,
        redirectUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx;

      // Validate invite + username before redirecting
      await validateInviteCode(supabase, input.inviteCode);
      await checkUsernameAvailable(supabase, input.username);

      // Build redirect URL with invite code and username as query params
      const redirectTo = new URL(input.redirectUrl);
      redirectTo.searchParams.set("invite_code", input.inviteCode);
      redirectTo.searchParams.set("username", input.username);

      const anon = createAnonClient();
      const { data, error } = await anon.auth.signInWithOAuth({
        provider: input.provider,
        options: { redirectTo: redirectTo.toString() },
      });

      if (error || !data.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate OAuth URL",
        });
      }

      return { url: data.url };
    }),

  /**
   * Complete OAuth sign-up after the user returns from the OAuth provider.
   * Validates the access token and invite code, creates a profile, marks invite used.
   */
  completeOAuthSignUp: publicProcedure
    .use(authRateLimit)
    .input(
      z.object({
        inviteCode: z.string().min(1),
        username: usernameSchema,
        accessToken: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx;

      // 1. Validate the access token
      const { data: userData, error: userErr } =
        await supabase.auth.getUser(input.accessToken);

      if (userErr || !userData.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid access token",
        });
      }

      const userId = userData.user.id;

      // 2. Check that no profile exists yet (prevent double-completion)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .limit(1);

      if (existingProfile && existingProfile.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Profile already exists for this user",
        });
      }

      // 3. Validate invite code
      const invite = await validateInviteCode(supabase, input.inviteCode);

      // 4. Check username availability
      await checkUsernameAvailable(supabase, input.username);

      // 5. Create profile
      const { error: profileErr } = await supabase.from("profiles").insert({
        id: userId,
        username: input.username,
      });

      if (profileErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: profileErr.message,
        });
      }

      // 6. Mark invite as used
      await supabase
        .from("invites")
        .update({ used_by: userId, used_at: new Date().toISOString() })
        .eq("id", invite.id);

      return { user: userData.user };
    }),
});
