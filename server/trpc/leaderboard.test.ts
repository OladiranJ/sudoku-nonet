/**
 * @jest-environment node
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

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

// Increase default timeout — tests hit a remote Supabase instance
jest.setTimeout(30_000);

import { createClient } from "@supabase/supabase-js";
import { createCallerFactory } from "./init";
import { appRouter } from "./router";
import { createServerClient } from "@/server/db/client";
import type { Session } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createCaller = createCallerFactory(appRouter);

describe("leaderboard.getLeaderboard", () => {
  let userAId: string;
  let userBId: string;
  let userCId: string;
  let sessionA: Session;
  const insertedGameIds: string[] = [];

  beforeAll(async () => {
    // Create 3 users: A follows B (for friends filter test)
    const users = [
      { email: "test-lb-a@nonet-test.local", pass: "test-pass-lb-a!", username: "lb_test_a" },
      { email: "test-lb-b@nonet-test.local", pass: "test-pass-lb-b!", username: "lb_test_b" },
      { email: "test-lb-c@nonet-test.local", pass: "test-pass-lb-c!", username: "lb_test_c" },
    ];

    const ids: string[] = [];
    for (const u of users) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.pass,
        email_confirm: true,
      });
      if (error) throw new Error(`Create user failed: ${error.message}`);
      ids.push(data.user.id);
      await admin.from("profiles").insert({ id: data.user.id, username: u.username });
    }
    [userAId, userBId, userCId] = ids;

    // A follows B (not C)
    await admin.from("follows").insert({
      follower_id: userAId,
      following_id: userBId,
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const gamesData = [
      // B: daily easy, recent, time 180
      {
        user_id: userBId,
        puzzle_seed: "lb-seed-b1",
        difficulty: "easy",
        time_seconds: 180,
        error_count: 0,
        hint_count: 0,
        is_daily: true,
        puzzle_date: now.toISOString().slice(0, 10),
        completed_at: now.toISOString(),
      },
      // B: daily easy, recent, time 150 (better time)
      {
        user_id: userBId,
        puzzle_seed: "lb-seed-b2",
        difficulty: "easy",
        time_seconds: 150,
        error_count: 1,
        hint_count: 0,
        is_daily: true,
        puzzle_date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        completed_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
      // C: daily easy, recent, time 120 (fastest)
      {
        user_id: userCId,
        puzzle_seed: "lb-seed-c1",
        difficulty: "easy",
        time_seconds: 120,
        error_count: 0,
        hint_count: 0,
        is_daily: true,
        puzzle_date: now.toISOString().slice(0, 10),
        completed_at: new Date(now.getTime() - 500).toISOString(),
      },
      // B: RANDOM easy game (should be excluded from leaderboard)
      {
        user_id: userBId,
        puzzle_seed: "lb-seed-b-rand",
        difficulty: "easy",
        time_seconds: 90,
        error_count: 0,
        hint_count: 0,
        is_daily: false,
        completed_at: now.toISOString(),
      },
      // C: daily easy, OLD (30 days ago) — excluded from "this-week"
      {
        user_id: userCId,
        puzzle_seed: "lb-seed-c-old",
        difficulty: "easy",
        time_seconds: 100,
        error_count: 0,
        hint_count: 0,
        is_daily: true,
        puzzle_date: thirtyDaysAgo.toISOString().slice(0, 10),
        completed_at: thirtyDaysAgo.toISOString(),
      },
    ];

    for (const g of gamesData) {
      const { data, error } = await admin.from("games").insert(g).select().single();
      if (error) throw new Error(`Insert game failed: ${error.message}`);
      insertedGameIds.push(data.id);
    }

    // Sign in user A
    const anonA = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: signA, error: signErrA } = await anonA.auth.signInWithPassword({
      email: "test-lb-a@nonet-test.local",
      password: "test-pass-lb-a!",
    });
    if (signErrA) throw new Error(`Sign in A failed: ${signErrA.message}`);
    sessionA = signA.session!;
  });

  afterAll(async () => {
    if (insertedGameIds.length > 0) {
      await admin.from("games").delete().in("id", insertedGameIds);
    }
    await admin.from("follows").delete().eq("follower_id", userAId);
    await admin.from("profiles").delete().in("id", [userAId, userBId, userCId]);
    await admin.auth.admin.deleteUser(userAId);
    await admin.auth.admin.deleteUser(userBId);
    await admin.auth.admin.deleteUser(userCId);
  });

  function makeCaller(session: Session | null) {
    return createCaller({
      session,
      supabase: createServerClient(),
    });
  }

  test("returns users ranked by best time for given difficulty", async () => {
    const caller = makeCaller(null);
    const result = await caller.leaderboard.getLeaderboard({
      difficulty: "easy",
      view: "all-time",
      friendsOnly: false,
    });

    // C has best time 100 (from old game), B has best time 150
    expect(result.entries.length).toBeGreaterThanOrEqual(2);
    const bEntry = result.entries.find((e) => e.username === "lb_test_b");
    const cEntry = result.entries.find((e) => e.username === "lb_test_c");
    expect(bEntry).toBeDefined();
    expect(cEntry).toBeDefined();
    // C should be ranked higher (lower time) than B
    expect(cEntry!.rank).toBeLessThan(bEntry!.rank);
  });

  test("only daily puzzle results are included (random excluded)", async () => {
    const caller = makeCaller(null);
    const result = await caller.leaderboard.getLeaderboard({
      difficulty: "easy",
      view: "all-time",
      friendsOnly: false,
    });

    const bEntry = result.entries.find((e) => e.username === "lb_test_b");
    expect(bEntry).toBeDefined();
    // B's random game had time 90, but it should be excluded.
    // B's best daily time is 150.
    expect(bEntry!.bestTime).toBe(150);
  });

  test("this-week view only includes games from the last 7 days", async () => {
    const caller = makeCaller(null);
    const result = await caller.leaderboard.getLeaderboard({
      difficulty: "easy",
      view: "this-week",
      friendsOnly: false,
    });

    const cEntry = result.entries.find((e) => e.username === "lb_test_c");
    expect(cEntry).toBeDefined();
    // C's old game (time 100, 30 days ago) should be excluded from this-week
    // C's only recent daily easy game is time 120
    expect(cEntry!.bestTime).toBe(120);
    expect(cEntry!.solveCount).toBe(1);
  });

  test("friends filter returns only followed users results", async () => {
    const caller = makeCaller(sessionA);
    const result = await caller.leaderboard.getLeaderboard({
      difficulty: "easy",
      view: "all-time",
      friendsOnly: true,
    });

    // A follows B only — C should not appear
    expect(result.entries.every((e) => e.username !== "lb_test_c")).toBe(true);
    const bEntry = result.entries.find((e) => e.username === "lb_test_b");
    expect(bEntry).toBeDefined();
  });

  test("each entry includes rank, username, best time, solve count", async () => {
    const caller = makeCaller(null);
    const result = await caller.leaderboard.getLeaderboard({
      difficulty: "easy",
      view: "all-time",
      friendsOnly: false,
    });

    for (const entry of result.entries) {
      expect(entry).toHaveProperty("rank");
      expect(entry).toHaveProperty("username");
      expect(entry).toHaveProperty("bestTime");
      expect(entry).toHaveProperty("solveCount");
      expect(typeof entry.rank).toBe("number");
      expect(typeof entry.username).toBe("string");
      expect(typeof entry.bestTime).toBe("number");
      expect(typeof entry.solveCount).toBe("number");
    }
  });

  test("users with no daily solves do not appear", async () => {
    const caller = makeCaller(null);
    const result = await caller.leaderboard.getLeaderboard({
      difficulty: "easy",
      view: "all-time",
      friendsOnly: false,
    });

    // User A has no games at all — should not appear
    expect(result.entries.find((e) => e.username === "lb_test_a")).toBeUndefined();
  });
});
