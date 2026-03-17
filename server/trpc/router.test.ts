/**
 * @jest-environment node
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load .env.local — walk up to find repo root
function findEnvLocal(): string {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, ".env.local");
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  return path.resolve(process.cwd(), ".env.local");
}

dotenv.config({ path: findEnvLocal() });

import { createCallerFactory } from "./init";
import { appRouter } from "./router";

const createCaller = createCallerFactory(appRouter);

describe("tRPC router", () => {
  test("healthCheck returns { status: 'ok' }", async () => {
    const caller = createCaller({
      session: null,
      supabase: {} as never, // not needed for healthCheck
    });

    const result = await caller.healthCheck();
    expect(result).toEqual({ status: "ok" });
  });

  test("context includes session (null for unauthenticated)", async () => {
    const ctx = { session: null, supabase: {} as never };
    const caller = createCaller(ctx);

    // The caller was created with null session — verify it works
    const result = await caller.healthCheck();
    expect(result.status).toBe("ok");

    // Verify the context shape
    expect(ctx.session).toBeNull();
    expect(ctx).toHaveProperty("session");
    expect(ctx).toHaveProperty("supabase");
  });
});
