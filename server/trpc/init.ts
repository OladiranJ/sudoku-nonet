import { initTRPC, TRPCError } from "@trpc/server";
import { createServerClient } from "@/server/db/client";
import type { SupabaseClient, Session } from "@supabase/supabase-js";

export type Context = {
  session: Session | null;
  supabase: SupabaseClient;
  clientIp: string;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

const enforceAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", ctx.session.user.id)
    .single();

  if (!profile?.is_admin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const adminProcedure = t.procedure.use(enforceAdmin);

/**
 * Create tRPC context from a fetch Request.
 * Extracts the Supabase auth session from the Authorization header if present.
 */
export async function createContext(opts: {
  req: Request;
}): Promise<Context> {
  const supabase = createServerClient();

  // Extract client IP for rate limiting
  const forwarded = opts.req.headers.get("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim() ||
    opts.req.headers.get("x-real-ip") ||
    "127.0.0.1";

  let session: Session | null = null;
  const authHeader = opts.req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(token);
    if (data.user) {
      // Build a minimal session object from the token and user
      session = {
        access_token: token,
        refresh_token: "",
        expires_in: 0,
        expires_at: 0,
        token_type: "bearer",
        user: data.user,
      };
    }
  }

  return { session, supabase, clientIp };
}
