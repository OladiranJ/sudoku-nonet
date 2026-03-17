import { initTRPC } from "@trpc/server";
import { createServerClient } from "@/server/db/client";
import type { SupabaseClient, Session } from "@supabase/supabase-js";

export type Context = {
  session: Session | null;
  supabase: SupabaseClient;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/**
 * Create tRPC context from a fetch Request.
 * Extracts the Supabase auth session from the Authorization header if present.
 */
export async function createContext(opts: {
  req: Request;
}): Promise<Context> {
  const supabase = createServerClient();

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

  return { session, supabase };
}
