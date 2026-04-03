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
import type { Session } from "@supabase/supabase-js";
import { cleanupTestUsers } from "@/server/test-utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Admin client — bypasses RLS for setup/teardown
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createCaller = createCallerFactory(appRouter);

describe("game.submitGame", () => {
  let testUserId: string;
  let testSession: Session;
  const insertedGameIds: string[] = [];

  beforeAll(async () => {
    await cleanupTestUsers(admin, ["test-game-submit@nonet-test.local"]);

    // Create a test user via admin API
    const { data, error } = await admin.auth.admin.createUser({
      email: "test-game-submit@nonet-test.local",
      password: "test-password-game-123!",
      email_confirm: true,
    });
    if (error) throw new Error(`Failed to create test user: ${error.message}`);
    testUserId = data.user.id;

    // Create a profile for the user
    await admin.from("profiles").insert({ id: testUserId, username: "test_game_submitter" });

    // Sign in to get a real session
    const { data: signIn, error: signInErr } = await createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    }).auth.signInWithPassword({
      email: "test-game-submit@nonet-test.local",
      password: "test-password-game-123!",
    });
    if (signInErr) throw new Error(`Failed to sign in: ${signInErr.message}`);
    testSession = signIn.session!;
  });

  afterAll(async () => {
    // Clean up all inserted game rows
    if (insertedGameIds.length > 0) {
      await admin.from("games").delete().in("id", insertedGameIds);
    }
    await admin.from("games").delete().eq("user_id", testUserId);
    await admin.from("profiles").delete().eq("id", testUserId);
    await admin.auth.admin.deleteUser(testUserId);
  });

  function makeCaller(session: Session | null = testSession) {
    return createCaller({
      session,
      supabase: createServerClient(),
    });
  }

  test("valid submission creates a row in games", async () => {
    const caller = makeCaller();
    const result = await caller.game.submitGame({
      seed: "test-seed-valid-001",
      difficulty: "easy",
      time_seconds: 120,
      error_count: 0,
      hint_count: 1,
      is_daily: false,
      puzzle_date: null,
    });

    expect(result).toBeDefined();
    expect(result.user_id).toBe(testUserId);
    expect(result.puzzle_seed).toBe("test-seed-valid-001");
    expect(result.difficulty).toBe("easy");
    expect(result.time_seconds).toBe(120);
    expect(result.is_daily).toBe(false);
    insertedGameIds.push(result.id);

    // Confirm row exists in DB
    const { data, error } = await admin
      .from("games")
      .select("*")
      .eq("id", result.id)
      .single();
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.puzzle_seed).toBe("test-seed-valid-001");
  });

  test("missing required fields rejected with validation error", async () => {
    const caller = makeCaller();

    await expect(
      // @ts-expect-error — intentionally passing incomplete input
      caller.game.submitGame({
        seed: "test-seed-missing-fields",
        // missing difficulty, time_seconds, error_count, hint_count, is_daily, puzzle_date
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  test("duplicate daily submission for same user + date + difficulty is rejected", async () => {
    const caller = makeCaller();

    // First submission should succeed
    const first = await caller.game.submitGame({
      seed: "test-seed-daily-dup",
      difficulty: "hard",
      time_seconds: 300,
      error_count: 2,
      hint_count: 0,
      is_daily: true,
      puzzle_date: "2026-03-18",
    });
    insertedGameIds.push(first.id);

    // Second submission for same date + difficulty should be rejected
    await expect(
      caller.game.submitGame({
        seed: "test-seed-daily-dup-2",
        difficulty: "hard",
        time_seconds: 250,
        error_count: 0,
        hint_count: 0,
        is_daily: true,
        puzzle_date: "2026-03-18",
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  test("random puzzle submissions are always accepted (no uniqueness constraint)", async () => {
    const caller = makeCaller();

    const first = await caller.game.submitGame({
      seed: "random-seed-aaa",
      difficulty: "medium",
      time_seconds: 200,
      error_count: 1,
      hint_count: 0,
      is_daily: false,
      puzzle_date: null,
    });
    insertedGameIds.push(first.id);

    // Second random submission with same difficulty — should also succeed
    const second = await caller.game.submitGame({
      seed: "random-seed-bbb",
      difficulty: "medium",
      time_seconds: 180,
      error_count: 0,
      hint_count: 2,
      is_daily: false,
      puzzle_date: null,
    });
    insertedGameIds.push(second.id);

    expect(first.id).not.toBe(second.id);
    expect(first.is_daily).toBe(false);
    expect(second.is_daily).toBe(false);
  });
});
