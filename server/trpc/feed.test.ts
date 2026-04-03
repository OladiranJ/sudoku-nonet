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
import { cleanupTestUsers } from "@/server/test-utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createCaller = createCallerFactory(appRouter);

describe("feed.getFeed", () => {
  let userAId: string;
  let userBId: string;
  let userCId: string;
  let sessionA: Session;
  let sessionC: Session;
  const insertedGameIds: string[] = [];

  beforeAll(async () => {
    // Create 3 users: A follows B, not C
    const users = [
      { email: "test-feed-a@nonet-test.local", pass: "test-pass-feed-a!", username: "feed_test_a" },
      { email: "test-feed-b@nonet-test.local", pass: "test-pass-feed-b!", username: "feed_test_b" },
      { email: "test-feed-c@nonet-test.local", pass: "test-pass-feed-c!", username: "feed_test_c" },
    ];

    // Clean up stale data from previous runs
    await cleanupTestUsers(admin, users.map((u) => u.email));

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

    // A follows B
    await admin.from("follows").insert({
      follower_id: userAId,
      following_id: userBId,
    });

    // B has 2 games, C has 1 game
    const now = new Date();
    const gamesData = [
      {
        user_id: userBId,
        puzzle_seed: "feed-seed-b1",
        difficulty: "easy",
        time_seconds: 120,
        error_count: 0,
        hint_count: 0,
        is_daily: false,
        completed_at: new Date(now.getTime() - 1000).toISOString(),
      },
      {
        user_id: userBId,
        puzzle_seed: "feed-seed-b2",
        difficulty: "hard",
        time_seconds: 400,
        error_count: 1,
        hint_count: 0,
        is_daily: true,
        puzzle_date: "2026-03-19",
        completed_at: now.toISOString(),
      },
      {
        user_id: userCId,
        puzzle_seed: "feed-seed-c1",
        difficulty: "medium",
        time_seconds: 250,
        error_count: 0,
        hint_count: 1,
        is_daily: false,
        completed_at: new Date(now.getTime() - 500).toISOString(),
      },
    ];

    for (const g of gamesData) {
      const { data, error } = await admin.from("games").insert(g).select().single();
      if (error) throw new Error(`Insert game failed: ${error.message}`);
      insertedGameIds.push(data.id);
    }

    // Sign in user A and C
    const anonA = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: signA, error: signErrA } = await anonA.auth.signInWithPassword({
      email: "test-feed-a@nonet-test.local",
      password: "test-pass-feed-a!",
    });
    if (signErrA) throw new Error(`Sign in A failed: ${signErrA.message}`);
    sessionA = signA.session!;

    const anonC = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: signC, error: signErrC } = await anonC.auth.signInWithPassword({
      email: "test-feed-c@nonet-test.local",
      password: "test-pass-feed-c!",
    });
    if (signErrC) throw new Error(`Sign in C failed: ${signErrC.message}`);
    sessionC = signC.session!;
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

  function makeCaller(session: Session) {
    return createCaller({
      session,
      supabase: createServerClient(),
    });
  }

  test("feed returns games from followed users only", async () => {
    const caller = makeCaller(sessionA);
    const result = await caller.feed.getFeed({ limit: 20 });

    // A follows B only, so should only see B's games
    expect(result.items.length).toBe(2);
    expect(result.items.every((item) => item.username === "feed_test_b")).toBe(true);
  });

  test("feed excludes games from non-followed users", async () => {
    const caller = makeCaller(sessionA);
    const result = await caller.feed.getFeed({ limit: 20 });

    // C's games should not appear
    expect(result.items.some((item) => item.username === "feed_test_c")).toBe(false);
  });

  test("feed items are ordered by most recent first", async () => {
    const caller = makeCaller(sessionA);
    const result = await caller.feed.getFeed({ limit: 20 });

    expect(result.items.length).toBe(2);
    // The hard/daily game was completed more recently
    expect(result.items[0].difficulty).toBe("hard");
    expect(result.items[1].difficulty).toBe("easy");
  });

  test("feed is empty if user follows no one", async () => {
    const caller = makeCaller(sessionC);
    const result = await caller.feed.getFeed({ limit: 20 });

    expect(result.items).toHaveLength(0);
  });
});
