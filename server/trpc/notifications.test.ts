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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createCaller = createCallerFactory(appRouter);

describe("notifications system", () => {
  let userAId: string;
  let userBId: string;
  let sessionA: Session;
  let notifIds: string[] = [];

  beforeAll(async () => {
    // Create user A
    const { data: dataA, error: errA } = await admin.auth.admin.createUser({
      email: "test-notif-a@nonet-test.local",
      password: "test-password-notif-a!",
      email_confirm: true,
    });
    if (errA) throw new Error(`Failed to create user A: ${errA.message}`);
    userAId = dataA.user.id;
    await admin.from("profiles").insert({ id: userAId, username: "notif_test_a" });

    // Create user B (for RLS isolation test)
    const { data: dataB, error: errB } = await admin.auth.admin.createUser({
      email: "test-notif-b@nonet-test.local",
      password: "test-password-notif-b!",
      email_confirm: true,
    });
    if (errB) throw new Error(`Failed to create user B: ${errB.message}`);
    userBId = dataB.user.id;
    await admin.from("profiles").insert({ id: userBId, username: "notif_test_b" });

    // Sign in user A
    const anonA = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data: signA, error: signErrA } = await anonA.auth.signInWithPassword({
      email: "test-notif-a@nonet-test.local",
      password: "test-password-notif-a!",
    });
    if (signErrA) throw new Error(`Sign in A failed: ${signErrA.message}`);
    sessionA = signA.session!;

    // Seed notifications for user A (different types, staggered timestamps)
    const notifications = [
      {
        user_id: userAId,
        type: "follow",
        payload: { follower_id: userBId, follower_username: "notif_test_b" },
        read: false,
        created_at: new Date(Date.now() - 4000).toISOString(),
      },
      {
        user_id: userAId,
        type: "challenge_received",
        payload: { challenge_id: "00000000-0000-0000-0000-000000000001", challenger_username: "notif_test_b", difficulty: "hard" },
        read: false,
        created_at: new Date(Date.now() - 3000).toISOString(),
      },
      {
        user_id: userAId,
        type: "challenge_result",
        payload: { challenge_id: "00000000-0000-0000-0000-000000000001", challenged_username: "notif_test_b", winner: "challenger", challenger_time: 120, challenged_time: 150 },
        read: false,
        created_at: new Date(Date.now() - 2000).toISOString(),
      },
      {
        user_id: userAId,
        type: "achievement",
        payload: { badge_id: "first_solve", badge_name: "First Solve", badge_description: "Complete your first puzzle" },
        read: false,
        created_at: new Date(Date.now() - 1000).toISOString(),
      },
    ];

    const { data: inserted, error: insertErr } = await admin
      .from("notifications")
      .insert(notifications)
      .select("id");
    if (insertErr) throw new Error(`Failed to seed notifications: ${insertErr.message}`);
    notifIds = inserted!.map((n: { id: string }) => n.id);

    // Seed a notification for user B (should NOT be visible to user A)
    await admin.from("notifications").insert({
      user_id: userBId,
      type: "achievement",
      payload: { badge_id: "speed_demon", badge_name: "Speed Demon", badge_description: "Solve Easy in under 3 min" },
      read: false,
    });
  });

  afterAll(async () => {
    await admin.from("notifications").delete().eq("user_id", userAId);
    await admin.from("notifications").delete().eq("user_id", userBId);
    await admin.from("profiles").delete().eq("id", userAId);
    await admin.from("profiles").delete().eq("id", userBId);
    await admin.auth.admin.deleteUser(userAId);
    await admin.auth.admin.deleteUser(userBId);
  });

  function makeCaller(session: Session = sessionA) {
    return createCaller({
      session,
      supabase: createServerClient(),
    });
  }

  test("getUnreadCount reflects actual unread notifications", async () => {
    const caller = makeCaller();
    const result = await caller.notification.getUnreadCount();

    expect(result.count).toBe(4);
  });

  test("list returns notifications sorted by most recent first", async () => {
    const caller = makeCaller();
    const notifications = await caller.notification.list();

    expect(notifications.length).toBe(4);

    // Most recent first — achievement was created last
    expect(notifications[0].type).toBe("achievement");
    expect(notifications[1].type).toBe("challenge_result");
    expect(notifications[2].type).toBe("challenge_received");
    expect(notifications[3].type).toBe("follow");

    // Verify timestamps are descending
    for (let i = 1; i < notifications.length; i++) {
      expect(new Date(notifications[i - 1].created_at).getTime()).toBeGreaterThanOrEqual(
        new Date(notifications[i].created_at).getTime()
      );
    }
  });

  test("only own notifications are returned (RLS)", async () => {
    const caller = makeCaller();
    const notifications = await caller.notification.list();

    // User A should not see user B's speed_demon notification
    const speedDemon = notifications.find(
      (n: { payload: { badge_id?: string } }) => n.payload?.badge_id === "speed_demon"
    );
    expect(speedDemon).toBeUndefined();
  });

  test("each notification type renders correctly in payload", async () => {
    const caller = makeCaller();
    const notifications = await caller.notification.list();

    const follow = notifications.find((n: { type: string }) => n.type === "follow");
    expect(follow?.payload.follower_username).toBe("notif_test_b");

    const challengeReceived = notifications.find((n: { type: string }) => n.type === "challenge_received");
    expect(challengeReceived?.payload.challenger_username).toBe("notif_test_b");
    expect(challengeReceived?.payload.difficulty).toBe("hard");

    const challengeResult = notifications.find((n: { type: string }) => n.type === "challenge_result");
    expect(challengeResult?.payload.winner).toBe("challenger");

    const achievement = notifications.find((n: { type: string }) => n.type === "achievement");
    expect(achievement?.payload.badge_name).toBe("First Solve");
  });

  test("markAsRead with specific ids marks them as read", async () => {
    const caller = makeCaller();

    // Mark the first two notifications as read
    const idsToMark = notifIds.slice(0, 2);
    await caller.notification.markAsRead({ ids: idsToMark });

    // Verify count decreased
    const { count } = await caller.notification.getUnreadCount();
    expect(count).toBe(2);

    // Verify those specific notifications are now read
    const { data } = await admin
      .from("notifications")
      .select("id, read")
      .in("id", idsToMark);
    for (const notif of data!) {
      expect(notif.read).toBe(true);
    }
  });

  test("markAsRead with all: true marks all as read", async () => {
    const caller = makeCaller();

    await caller.notification.markAsRead({ all: true });

    const { count } = await caller.notification.getUnreadCount();
    expect(count).toBe(0);

    // Verify all of user A's notifications are read
    const { data } = await admin
      .from("notifications")
      .select("id, read")
      .eq("user_id", userAId);
    for (const notif of data!) {
      expect(notif.read).toBe(true);
    }
  });

  test("notifications are sorted by most recent first after read status change", async () => {
    const caller = makeCaller();
    const notifications = await caller.notification.list();

    // Order should be preserved even though all are now read
    expect(notifications.length).toBe(4);
    for (let i = 1; i < notifications.length; i++) {
      expect(new Date(notifications[i - 1].created_at).getTime()).toBeGreaterThanOrEqual(
        new Date(notifications[i].created_at).getTime()
      );
    }
  });
});
