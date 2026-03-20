/**
 * @jest-environment node
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
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

describe("follow system", () => {
  let userAId: string;
  let userBId: string;
  let sessionA: Session;
  let sessionB: Session;

  beforeAll(async () => {
    // Create user A
    const { data: dataA, error: errA } = await admin.auth.admin.createUser({
      email: "test-follow-a@nonet-test.local",
      password: "test-password-follow-a!",
      email_confirm: true,
    });
    if (errA) throw new Error(`Failed to create user A: ${errA.message}`);
    userAId = dataA.user.id;
    await admin.from("profiles").insert({ id: userAId, username: "follow_test_a" });

    // Create user B
    const { data: dataB, error: errB } = await admin.auth.admin.createUser({
      email: "test-follow-b@nonet-test.local",
      password: "test-password-follow-b!",
      email_confirm: true,
    });
    if (errB) throw new Error(`Failed to create user B: ${errB.message}`);
    userBId = dataB.user.id;
    await admin.from("profiles").insert({ id: userBId, username: "follow_test_b" });

    // Sign in both users
    const anonA = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: signA, error: signErrA } = await anonA.auth.signInWithPassword({
      email: "test-follow-a@nonet-test.local",
      password: "test-password-follow-a!",
    });
    if (signErrA) throw new Error(`Sign in A failed: ${signErrA.message}`);
    sessionA = signA.session!;

    const anonB = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: signB, error: signErrB } = await anonB.auth.signInWithPassword({
      email: "test-follow-b@nonet-test.local",
      password: "test-password-follow-b!",
    });
    if (signErrB) throw new Error(`Sign in B failed: ${signErrB.message}`);
    sessionB = signB.session!;
  });

  afterAll(async () => {
    // Clean up
    await admin.from("notifications").delete().eq("user_id", userBId);
    await admin.from("notifications").delete().eq("user_id", userAId);
    await admin.from("follows").delete().eq("follower_id", userAId);
    await admin.from("follows").delete().eq("follower_id", userBId);
    await admin.from("profiles").delete().eq("id", userAId);
    await admin.from("profiles").delete().eq("id", userBId);
    await admin.auth.admin.deleteUser(userAId);
    await admin.auth.admin.deleteUser(userBId);
  });

  function makeCaller(session: Session) {
    return createCaller({
      session,
      supabase: createServerClient(),
    });
  }

  test("follow mutation creates a row in follows", async () => {
    const caller = makeCaller(sessionA);
    const result = await caller.follow.follow({ userId: userBId });

    expect(result.success).toBe(true);
    expect(result.alreadyFollowing).toBe(false);

    // Verify row exists
    const { data } = await admin
      .from("follows")
      .select("*")
      .eq("follower_id", userAId)
      .eq("following_id", userBId);
    expect(data).toHaveLength(1);
  });

  test("duplicate follow is a no-op", async () => {
    const caller = makeCaller(sessionA);
    const result = await caller.follow.follow({ userId: userBId });

    expect(result.success).toBe(true);
    expect(result.alreadyFollowing).toBe(true);

    // Still only 1 row
    const { data } = await admin
      .from("follows")
      .select("*")
      .eq("follower_id", userAId)
      .eq("following_id", userBId);
    expect(data).toHaveLength(1);
  });

  test("cannot follow yourself", async () => {
    const caller = makeCaller(sessionA);

    await expect(
      caller.follow.follow({ userId: userAId })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("following triggers a notification for the followed user", async () => {
    // The follow in the first test should have created a notification
    const { data } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", userBId)
      .eq("type", "follow");

    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    const notif = data!.find(
      (n: { payload: { follower_id: string } }) => n.payload?.follower_id === userAId
    );
    expect(notif).toBeDefined();
    expect(notif!.payload.follower_username).toBe("follow_test_a");
  });

  test("unfollow mutation deletes the row", async () => {
    const caller = makeCaller(sessionA);
    const result = await caller.follow.unfollow({ userId: userBId });

    expect(result.success).toBe(true);

    // Verify row is gone
    const { data } = await admin
      .from("follows")
      .select("*")
      .eq("follower_id", userAId)
      .eq("following_id", userBId);
    expect(data).toHaveLength(0);
  });
});
