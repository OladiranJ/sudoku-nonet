import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import type { Context } from "@/server/trpc/init";

// Lazy-init Redis client — null when env vars are missing (local dev)
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

type RateLimitConfig = {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration string, e.g. "1 m", "10 s" */
  window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`;
  /** Prefix for the Redis key to isolate different limiters */
  prefix: string;
  /** How to derive the identifier from context — "ip" or "userId" */
  identifierSource: "ip" | "userId";
};

const t = initTRPC.context<Context>().create();

/**
 * Create a tRPC middleware that rate-limits requests.
 * Gracefully skips rate limiting when Upstash env vars are not configured.
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  // Build the Ratelimit instance lazily on first call
  let limiter: Ratelimit | null = null;

  function getLimiter(): Ratelimit | null {
    if (limiter) return limiter;
    const r = getRedis();
    if (!r) return null;
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(config.limit, config.window),
      prefix: `ratelimit:${config.prefix}`,
    });
    return limiter;
  }

  return t.middleware(async ({ ctx, next }) => {
    const rl = getLimiter();
    if (!rl) {
      // No Redis configured — skip rate limiting
      return next();
    }

    const identifier =
      config.identifierSource === "userId"
        ? ctx.session?.user?.id ?? ctx.clientIp
        : ctx.clientIp;

    const result = await rl.limit(identifier);

    if (!result.success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please try again later.",
      });
    }

    return next();
  });
}

/** Rate limit for auth endpoints: 10 req / 1 min per IP */
export const authRateLimit = createRateLimitMiddleware({
  limit: 10,
  window: "1 m",
  prefix: "auth",
  identifierSource: "ip",
});

/** Rate limit for invite validation: 20 req / 1 min per IP */
export const inviteRateLimit = createRateLimitMiddleware({
  limit: 20,
  window: "1 m",
  prefix: "invite",
  identifierSource: "ip",
});

/** Rate limit for game submission: 10 req / 1 min per user */
export const gameRateLimit = createRateLimitMiddleware({
  limit: 10,
  window: "1 m",
  prefix: "game",
  identifierSource: "userId",
});
