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
import { createCallerFactory } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";
import { createServerClient } from "@/server/db/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client — bypasses RLS for setup/teardown
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createCaller = createCallerFactory(appRouter);

function makeCaller() {
  return createCaller({
    session: null,
    supabase: createServerClient(),
  });
}

// Track created resources for cleanup
const createdUserIds: string[] = [];
const createdInviteIds: string[] = [];

async function createTestInvite(overrides: {
  code?: string;
  expiresAt?: string;
  usedBy?: string;
} = {}) {
  const code = overrides.code ?? `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt =
    overrides.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("invites")
    .insert({
      code,
      expires_at: expiresAt,
      ...(overrides.usedBy
        ? { used_by: overrides.usedBy, used_at: new Date().toISOString() }
        : {}),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create test invite: ${error.message}`);
  createdInviteIds.push(data.id);
  return data;
}

afterAll(async () => {
  // Clean up invites first (they reference profiles)
  if (createdInviteIds.length > 0) {
    await admin.from("invites").delete().in("id", createdInviteIds);
  }
  // Clean up profiles and auth users
  for (const userId of createdUserIds) {
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  }
});

describe("auth.signUp", () => {
  test("sign-up without valid invite code is rejected", async () => {
    const caller = makeCaller();

    await expect(
      caller.auth.signUp({
        email: "no-invite@nonet-test.local",
        password: "test-password-123!",
        inviteCode: "nonexistent-code-xyz",
        username: "no_invite_user",
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  test("sign-up with valid invite code succeeds", async () => {
    const invite = await createTestInvite({ code: "valid-signup-test" });
    const caller = makeCaller();

    const result = await caller.auth.signUp({
      email: "valid-signup@nonet-test.local",
      password: "test-password-123!",
      inviteCode: "valid-signup-test",
      username: "valid_signup_user",
    });

    // Track for cleanup
    createdUserIds.push(result.user.id);

    // Verify user and session returned
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("valid-signup@nonet-test.local");
    expect(result.session).toBeDefined();
    expect(result.session.access_token).toBeTruthy();

    // Verify profile was created
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", result.user.id)
      .single();
    expect(profile).toBeDefined();
    expect(profile!.username).toBe("valid_signup_user");

    // Verify invite was marked as used
    const { data: usedInvite } = await admin
      .from("invites")
      .select("*")
      .eq("id", invite.id)
      .single();
    expect(usedInvite!.used_by).toBe(result.user.id);
    expect(usedInvite!.used_at).toBeTruthy();
  });

  test("sign-up with expired invite code is rejected", async () => {
    await createTestInvite({
      code: "expired-invite-test",
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString(), // expired 1 minute ago
    });
    const caller = makeCaller();

    await expect(
      caller.auth.signUp({
        email: "expired-invite@nonet-test.local",
        password: "test-password-123!",
        inviteCode: "expired-invite-test",
        username: "expired_invite_user",
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  test("sign-up with already-used invite code is rejected", async () => {
    // Create a user to be the "used_by" reference
    const { data: fakeUser } = await admin.auth.admin.createUser({
      email: "fake-used-by@nonet-test.local",
      password: "fake-password-123!",
      email_confirm: true,
    });
    createdUserIds.push(fakeUser.user!.id);
    await admin.from("profiles").insert({
      id: fakeUser.user!.id,
      username: "fake_used_by_user",
    });

    await createTestInvite({
      code: "used-invite-test",
      usedBy: fakeUser.user!.id,
    });

    const caller = makeCaller();

    await expect(
      caller.auth.signUp({
        email: "used-invite@nonet-test.local",
        password: "test-password-123!",
        inviteCode: "used-invite-test",
        username: "used_invite_user",
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  test("sign-up with duplicate username is rejected", async () => {
    // The user "valid_signup_user" was created in an earlier test
    const invite = await createTestInvite({ code: "dup-username-test" });
    const caller = makeCaller();

    await expect(
      caller.auth.signUp({
        email: "dup-username@nonet-test.local",
        password: "test-password-123!",
        inviteCode: "dup-username-test",
        username: "valid_signup_user", // already taken
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});

describe("auth.login", () => {
  test("login with valid credentials returns a session", async () => {
    // Use the user created in the signUp test above
    const caller = makeCaller();

    const result = await caller.auth.login({
      email: "valid-signup@nonet-test.local",
      password: "test-password-123!",
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("valid-signup@nonet-test.local");
    expect(result.session).toBeDefined();
    expect(result.session.access_token).toBeTruthy();
  });

  test("login with invalid credentials is rejected", async () => {
    const caller = makeCaller();

    await expect(
      caller.auth.login({
        email: "valid-signup@nonet-test.local",
        password: "wrong-password-999!",
      })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
