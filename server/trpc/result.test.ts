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

import { createClient } from "@supabase/supabase-js";
import { createCallerFactory } from "./init";
import { appRouter } from "./router";
import { createServerClient } from "@/server/db/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client — bypasses RLS for setup/teardown
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createCaller = createCallerFactory(appRouter);

describe("result.getResult", () => {
  let testUserId: string;
  let testGameId: string;

  beforeAll(async () => {
    // Create a test user via admin API
    const { data, error } = await admin.auth.admin.createUser({
      email: "test-result-page@nonet-test.local",
      password: "test-password-result-123!",
      email_confirm: true,
    });
    if (error) throw new Error(`Failed to create test user: ${error.message}`);
    testUserId = data.user.id;

    // Create a profile for the user
    await admin
      .from("profiles")
      .insert({ id: testUserId, username: "test_result_user" });

    // Insert a test game directly via admin client
    const { data: gameData, error: gameErr } = await admin
      .from("games")
      .insert({
        user_id: testUserId,
        puzzle_seed: "test-result-seed-001",
        difficulty: "hard",
        time_seconds: 245,
        error_count: 3,
        hint_count: 1,
        is_daily: true,
        puzzle_date: "2026-03-20",
      })
      .select()
      .single();
    if (gameErr) throw new Error(`Failed to create test game: ${gameErr.message}`);
    testGameId = gameData.id;
  });

  afterAll(async () => {
    await admin.from("games").delete().eq("id", testGameId);
    await admin.from("profiles").delete().eq("id", testUserId);
    await admin.auth.admin.deleteUser(testUserId);
  });

  function makeCaller() {
    return createCaller({
      session: null,
      supabase: createServerClient(),
    });
  }

  test("returns game data with username for valid gameId", async () => {
    const caller = makeCaller();
    const result = await caller.result.getResult({ gameId: testGameId });

    expect(result).toBeDefined();
    expect(result.id).toBe(testGameId);
    expect(result.difficulty).toBe("hard");
    expect(result.time_seconds).toBe(245);
    expect(result.error_count).toBe(3);
    expect(result.hint_count).toBe(1);
    expect(result.is_daily).toBe(true);
    expect(result.username).toBe("test_result_user");
  });

  test("throws NOT_FOUND for invalid gameId", async () => {
    const caller = makeCaller();

    await expect(
      caller.result.getResult({
        gameId: "00000000-0000-0000-0000-000000000000",
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
