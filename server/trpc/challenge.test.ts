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

describe("challenge system", () => {
  let challengerId: string;
  let challengedId: string;
  let sessionChallenger: Session;
  let sessionChallenged: Session;
  const insertedChallengeIds: string[] = [];

  beforeAll(async () => {
    await cleanupTestUsers(admin, [
      "test-challenge-r@nonet-test.local",
      "test-challenge-d@nonet-test.local",
    ]);

    // Create challenger
    const { data: d1, error: e1 } = await admin.auth.admin.createUser({
      email: "test-challenge-r@nonet-test.local",
      password: "test-pass-challenge-r!",
      email_confirm: true,
    });
    if (e1) throw new Error(`Create challenger failed: ${e1.message}`);
    challengerId = d1.user.id;
    await admin.from("profiles").insert({ id: challengerId, username: "challenger_test" });

    // Create challenged
    const { data: d2, error: e2 } = await admin.auth.admin.createUser({
      email: "test-challenge-d@nonet-test.local",
      password: "test-pass-challenge-d!",
      email_confirm: true,
    });
    if (e2) throw new Error(`Create challenged failed: ${e2.message}`);
    challengedId = d2.user.id;
    await admin.from("profiles").insert({ id: challengedId, username: "challenged_test" });

    // Sign in both
    const anon1 = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: s1, error: se1 } = await anon1.auth.signInWithPassword({
      email: "test-challenge-r@nonet-test.local",
      password: "test-pass-challenge-r!",
    });
    if (se1) throw new Error(`Sign in challenger failed: ${se1.message}`);
    sessionChallenger = s1.session!;

    const anon2 = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: s2, error: se2 } = await anon2.auth.signInWithPassword({
      email: "test-challenge-d@nonet-test.local",
      password: "test-pass-challenge-d!",
    });
    if (se2) throw new Error(`Sign in challenged failed: ${se2.message}`);
    sessionChallenged = s2.session!;
  });

  afterAll(async () => {
    if (insertedChallengeIds.length > 0) {
      await admin.from("challenges").delete().in("id", insertedChallengeIds);
    }
    await admin.from("notifications").delete().eq("user_id", challengedId);
    await admin.from("notifications").delete().eq("user_id", challengerId);
    await admin.from("profiles").delete().eq("id", challengerId);
    await admin.from("profiles").delete().eq("id", challengedId);
    await admin.auth.admin.deleteUser(challengerId);
    await admin.auth.admin.deleteUser(challengedId);
  });

  function makeCaller(session: Session) {
    return createCaller({
      session,
      supabase: createServerClient(),
    });
  }

  test("creating a challenge inserts a row with correct seed and time", async () => {
    const caller = makeCaller(sessionChallenger);
    const result = await caller.challenge.create({
      challengedId,
      puzzleSeed: "challenge-seed-001",
      difficulty: "medium",
      challengerTime: 180,
      isDaily: false,
    });

    expect(result).toBeDefined();
    expect(result.challenger_id).toBe(challengerId);
    expect(result.challenged_id).toBe(challengedId);
    expect(result.puzzle_seed).toBe("challenge-seed-001");
    expect(result.challenger_time).toBe(180);
    expect(result.status).toBe("pending");
    insertedChallengeIds.push(result.id);
  });

  test("challenged user receives a challenge_received notification", async () => {
    const { data } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", challengedId)
      .eq("type", "challenge_received");

    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    const notif = data!.find(
      (n: { payload: { challenger_username: string } }) =>
        n.payload?.challenger_username === "challenger_test"
    );
    expect(notif).toBeDefined();
  });

  test("completing a challenge updates challenged_time and sets status to completed", async () => {
    const challengeId = insertedChallengeIds[0];
    const caller = makeCaller(sessionChallenged);
    const result = await caller.challenge.complete({
      challengeId,
      time: 200,
    });

    expect(result.challenged_time).toBe(200);
    expect(result.status).toBe("completed");
    expect(result.winner).toBe("challenger"); // 180 < 200, challenger wins
  });

  test("challenge page shows both times and highlights the winner", async () => {
    const challengeId = insertedChallengeIds[0];
    const caller = makeCaller(sessionChallenger);
    const result = await caller.challenge.getById({ id: challengeId });

    expect(result.challenger?.username).toBe("challenger_test");
    expect(result.challenged?.username).toBe("challenged_test");
    expect(result.challenger_time).toBe(180);
    expect(result.challenged_time).toBe(200);
    expect(result.winner).toBe("challenger");
  });

  test("attempting to challenge with a daily puzzle seed is rejected", async () => {
    const caller = makeCaller(sessionChallenger);

    await expect(
      caller.challenge.create({
        challengedId,
        puzzleSeed: "daily-seed-reject",
        difficulty: "hard",
        challengerTime: 300,
        isDaily: true,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
