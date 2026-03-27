/**
 * @jest-environment node
 */

import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "@/server/trpc/init";
import { createRateLimitMiddleware } from "./rateLimit";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a minimal tRPC stack with a rate-limited procedure for testing. */
function buildTestRouter(config: Parameters<typeof createRateLimitMiddleware>[0]) {
  const t = initTRPC.context<Context>().create();
  const middleware = createRateLimitMiddleware(config);

  const appRouter = t.router({
    limited: t.procedure.use(middleware).query(() => ({ ok: true })),
  });

  const createCaller = t.createCallerFactory(appRouter);
  return { createCaller };
}

function fakeContext(overrides: Partial<Context> = {}): Context {
  return {
    session: null,
    supabase: {} as Context["supabase"],
    clientIp: "192.168.1.100",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("rate limiting middleware", () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  afterAll(() => {
    // Restore original env
    if (originalUrl) process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    else delete process.env.UPSTASH_REDIS_REST_URL;
    if (originalToken) process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    else delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  describe("when Upstash env vars are NOT set (graceful degradation)", () => {
    beforeEach(() => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it("allows requests through without rate limiting", async () => {
      const { createCaller } = buildTestRouter({
        limit: 1,
        window: "1 m",
        prefix: "test-no-redis",
        identifierSource: "ip",
      });

      const caller = createCaller(fakeContext());

      // Even with limit of 1, multiple calls succeed because Redis is not available
      const r1 = await caller.limited();
      const r2 = await caller.limited();
      const r3 = await caller.limited();

      expect(r1).toEqual({ ok: true });
      expect(r2).toEqual({ ok: true });
      expect(r3).toEqual({ ok: true });
    });
  });

  describe("when Upstash env vars ARE set", () => {
    // Use a real Upstash instance if available, otherwise skip
    const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

    const conditionalIt = hasUpstash ? it : it.skip;

    conditionalIt("allows requests within the limit", async () => {
      const uniquePrefix = `test-allow-${Date.now()}`;
      const { createCaller } = buildTestRouter({
        limit: 5,
        window: "1 m",
        prefix: uniquePrefix,
        identifierSource: "ip",
      });

      const caller = createCaller(fakeContext());

      // 5 requests should all succeed
      for (let i = 0; i < 5; i++) {
        const result = await caller.limited();
        expect(result).toEqual({ ok: true });
      }
    });

    conditionalIt("rejects requests exceeding the limit with TOO_MANY_REQUESTS", async () => {
      const uniquePrefix = `test-reject-${Date.now()}`;
      const { createCaller } = buildTestRouter({
        limit: 2,
        window: "1 m",
        prefix: uniquePrefix,
        identifierSource: "ip",
      });

      const caller = createCaller(fakeContext());

      // First 2 should succeed
      await caller.limited();
      await caller.limited();

      // Third should fail
      await expect(caller.limited()).rejects.toThrow(TRPCError);
      try {
        await caller.limited();
      } catch (err) {
        expect(err).toBeInstanceOf(TRPCError);
        expect((err as TRPCError).code).toBe("TOO_MANY_REQUESTS");
      }
    });

    conditionalIt("uses userId when identifierSource is userId", async () => {
      const uniquePrefix = `test-userid-${Date.now()}`;
      const { createCaller } = buildTestRouter({
        limit: 2,
        window: "1 m",
        prefix: uniquePrefix,
        identifierSource: "userId",
      });

      // User A hits the limit
      const callerA = createCaller(
        fakeContext({
          session: {
            access_token: "a",
            refresh_token: "",
            expires_in: 0,
            expires_at: 0,
            token_type: "bearer",
            user: { id: "user-a" } as any,
          },
        })
      );
      await callerA.limited();
      await callerA.limited();
      await expect(callerA.limited()).rejects.toThrow(TRPCError);

      // User B should still be able to call (different identifier)
      const callerB = createCaller(
        fakeContext({
          session: {
            access_token: "b",
            refresh_token: "",
            expires_in: 0,
            expires_at: 0,
            token_type: "bearer",
            user: { id: "user-b" } as any,
          },
        })
      );
      const result = await callerB.limited();
      expect(result).toEqual({ ok: true });
    });
  });

  describe("middleware creation", () => {
    it("createRateLimitMiddleware returns a middleware object", () => {
      const mw = createRateLimitMiddleware({
        limit: 10,
        window: "1 m",
        prefix: "test-factory",
        identifierSource: "ip",
      });
      expect(mw).toBeDefined();
      expect(typeof mw).toBe("object");
    });
  });
});
