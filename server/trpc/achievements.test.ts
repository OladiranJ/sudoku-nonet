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

describe("achievement system", () => {
  let testUserId: string;
  let testSession: Session;

  beforeAll(async () => {
    await cleanupTestUsers(admin, ["test-achievement@nonet-test.local"]);

    // Create test user
    const { data, error } = await admin.auth.admin.createUser({
      email: "test-achievement@nonet-test.local",
      password: "test-password-achievement-123!",
      email_confirm: true,
    });
    if (error) throw new Error(`Failed to create test user: ${error.message}`);
    testUserId = data.user.id;

    await admin
      .from("profiles")
      .insert({ id: testUserId, username: "test_achievement_user" });

    // Sign in
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data: signIn, error: signErr } =
      await anon.auth.signInWithPassword({
        email: "test-achievement@nonet-test.local",
        password: "test-password-achievement-123!",
      });
    if (signErr) throw new Error(`Sign in failed: ${signErr.message}`);
    testSession = signIn.session!;
  });

  afterAll(async () => {
    // Clean up
    await admin.from("notifications").delete().eq("user_id", testUserId);
    await admin.from("achievements").delete().eq("user_id", testUserId);
    await admin.from("profiles").delete().eq("id", testUserId);
    await admin.auth.admin.deleteUser(testUserId);
  });

  function makeCaller(session: Session = testSession) {
    return createCaller({
      session,
      supabase: createServerClient(),
    });
  }

  test("First Solve achievement can be granted", async () => {
    const caller = makeCaller();
    const result = await caller.achievement.grantAchievement({
      badgeId: "first_solve",
    });

    expect(result.granted).toBe(true);
    expect(result.alreadyEarned).toBe(false);

    // Verify row exists in DB
    const { data } = await admin
      .from("achievements")
      .select("*")
      .eq("user_id", testUserId)
      .eq("badge_id", "first_solve");
    expect(data).toHaveLength(1);
  });

  test("duplicate achievement is not created (unique constraint)", async () => {
    const caller = makeCaller();
    const result = await caller.achievement.grantAchievement({
      badgeId: "first_solve",
    });

    expect(result.granted).toBe(false);
    expect(result.alreadyEarned).toBe(true);

    // Still only 1 row
    const { data } = await admin
      .from("achievements")
      .select("*")
      .eq("user_id", testUserId)
      .eq("badge_id", "first_solve");
    expect(data).toHaveLength(1);
  });

  test("achievement triggers a notification", async () => {
    const { data } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", testUserId)
      .eq("type", "achievement");

    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    const notif = data!.find(
      (n: { payload: { badge_id: string } }) =>
        n.payload?.badge_id === "first_solve"
    );
    expect(notif).toBeDefined();
    expect(notif!.payload.badge_name).toBe("First Solve");
  });

  test("Speed Demon achievement can be granted", async () => {
    const caller = makeCaller();
    const result = await caller.achievement.grantAchievement({
      badgeId: "speed_demon",
    });
    expect(result.granted).toBe(true);
    expect(result.alreadyEarned).toBe(false);
  });

  test("Expert Mind achievement can be granted", async () => {
    const caller = makeCaller();
    const result = await caller.achievement.grantAchievement({
      badgeId: "expert_mind",
    });
    expect(result.granted).toBe(true);
    expect(result.alreadyEarned).toBe(false);
  });

  test("Clean Sheet achievement can be granted", async () => {
    const caller = makeCaller();
    const result = await caller.achievement.grantAchievement({
      badgeId: "clean_sheet",
    });
    expect(result.granted).toBe(true);
    expect(result.alreadyEarned).toBe(false);
  });

  test("Hint-Free achievement can be granted", async () => {
    const caller = makeCaller();
    const result = await caller.achievement.grantAchievement({
      badgeId: "hint_free",
    });
    expect(result.granted).toBe(true);
    expect(result.alreadyEarned).toBe(false);
  });

  test("Social Butterfly achievement can be granted", async () => {
    const caller = makeCaller();
    const result = await caller.achievement.grantAchievement({
      badgeId: "social_butterfly",
    });
    expect(result.granted).toBe(true);
    expect(result.alreadyEarned).toBe(false);
  });

  test("Challenger achievement can be granted", async () => {
    const caller = makeCaller();
    const result = await caller.achievement.grantAchievement({
      badgeId: "challenger",
    });
    expect(result.granted).toBe(true);
    expect(result.alreadyEarned).toBe(false);
  });

  test("unknown badge_id is rejected", async () => {
    const caller = makeCaller();
    await expect(
      caller.achievement.grantAchievement({ badgeId: "nonexistent_badge" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("getMyAchievements returns all earned badges", async () => {
    const caller = makeCaller();
    const achievements = await caller.achievement.getMyAchievements();

    expect(achievements.length).toBe(7);
    const badgeIds = achievements.map(
      (a: { badge_id: string }) => a.badge_id
    );
    expect(badgeIds).toContain("first_solve");
    expect(badgeIds).toContain("speed_demon");
    expect(badgeIds).toContain("expert_mind");
    expect(badgeIds).toContain("clean_sheet");
    expect(badgeIds).toContain("hint_free");
    expect(badgeIds).toContain("social_butterfly");
    expect(badgeIds).toContain("challenger");
  });
});
