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

// Increase default timeout — tests hit a remote Supabase instance
jest.setTimeout(30_000);

import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import { createCallerFactory } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";
import { createServerClient } from "@/server/db/client";
import { cleanupTestUsers, cleanupTestInvitesByCode } from "@/server/test-utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin Supabase client — bypasses RLS for setup/teardown
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createCaller = createCallerFactory(appRouter);

/** Create a tRPC caller with a given session (or null for unauthenticated). */
function makeCaller(session: Session | null = null) {
  return createCaller({
    session,
    supabase: createServerClient(),
  });
}

/** Build a minimal Session object from a user id and access token. */
function buildSession(userId: string, accessToken: string): Session {
  return {
    access_token: accessToken,
    refresh_token: "",
    expires_in: 0,
    expires_at: 0,
    token_type: "bearer",
    user: { id: userId } as Session["user"],
  };
}

// Track created resources for cleanup
const createdUserIds: string[] = [];
const createdInviteIds: string[] = [];

// Shared test state
let adminUserId: string;
let adminSession: Session;
let regularUserId: string;
let regularSession: Session;

beforeAll(async () => {
  await cleanupTestUsers(supabaseAdmin, [
    "invite-test-admin@nonet-test.local",
    "invite-test-regular@nonet-test.local",
  ]);

  // Create admin user
  const { data: adminData } = await supabaseAdmin.auth.admin.createUser({
    email: "invite-test-admin@nonet-test.local",
    password: "admin-password-123!",
    email_confirm: true,
  });
  adminUserId = adminData.user!.id;
  createdUserIds.push(adminUserId);

  await supabaseAdmin.from("profiles").insert({
    id: adminUserId,
    username: "invite_test_admin",
    is_admin: true,
  });

  // Sign in admin to get a real access token
  const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: adminSignIn } = await anonClient.auth.signInWithPassword({
    email: "invite-test-admin@nonet-test.local",
    password: "admin-password-123!",
  });
  adminSession = adminSignIn.session!;

  // Create regular (non-admin) user
  const { data: regularData } = await supabaseAdmin.auth.admin.createUser({
    email: "invite-test-regular@nonet-test.local",
    password: "regular-password-123!",
    email_confirm: true,
  });
  regularUserId = regularData.user!.id;
  createdUserIds.push(regularUserId);

  await supabaseAdmin.from("profiles").insert({
    id: regularUserId,
    username: "invite_test_regular",
    is_admin: false,
  });

  const { data: regularSignIn } = await anonClient.auth.signInWithPassword({
    email: "invite-test-regular@nonet-test.local",
    password: "regular-password-123!",
  });
  regularSession = regularSignIn.session!;
});

afterAll(async () => {
  // Clean up invites first (they reference profiles)
  if (createdInviteIds.length > 0) {
    await supabaseAdmin.from("invites").delete().in("id", createdInviteIds);
  }
  // Also clean up any invites created by our admin user (from generate tests)
  await supabaseAdmin.from("invites").delete().eq("created_by", adminUserId);

  // Clean up profiles and auth users
  for (const userId of createdUserIds) {
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
  }
});

describe("invite.generate", () => {
  test("admin can generate an invite code", async () => {
    const caller = makeCaller(adminSession);

    const result = await caller.invite.generate();

    expect(result.id).toBeTruthy();
    expect(result.code).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/);
    expect(result.expiresAt).toBeTruthy();

    // Verify expiry is approximately 24h from now
    const expiresAt = new Date(result.expiresAt);
    const now = new Date();
    const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(23);
    expect(diffHours).toBeLessThanOrEqual(24);

    // Track for cleanup
    createdInviteIds.push(result.id);
  });

  test("non-admin cannot generate an invite code", async () => {
    const caller = makeCaller(regularSession);

    await expect(caller.invite.generate()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("unauthenticated user cannot generate an invite code", async () => {
    const caller = makeCaller(null);

    await expect(caller.invite.generate()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("invite.list", () => {
  test("admin can list invites", async () => {
    const caller = makeCaller(adminSession);

    // Generate one so there's at least one to list
    const generated = await caller.invite.generate();
    createdInviteIds.push(generated.id);

    const list = await caller.invite.list();

    expect(Array.isArray(list)).toBe(true);
    const found = list.find((inv: { id: string }) => inv.id === generated.id);
    expect(found).toBeDefined();
    expect(found!.code).toBe(generated.code);
    expect(found!.status).toBe("pending");
  });

  test("non-admin cannot list invites", async () => {
    const caller = makeCaller(regularSession);

    await expect(caller.invite.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("invite.revoke", () => {
  test("admin can revoke an unused invite", async () => {
    const caller = makeCaller(adminSession);
    const generated = await caller.invite.generate();
    createdInviteIds.push(generated.id);

    const result = await caller.invite.revoke({ id: generated.id });
    expect(result.success).toBe(true);

    // Verify it's gone
    const { data } = await supabaseAdmin
      .from("invites")
      .select("id")
      .eq("id", generated.id)
      .single();
    expect(data).toBeNull();
  });

  test("admin cannot revoke an already-used invite", async () => {
    // Create an invite and mark it as used
    const code = `used-revoke-${Date.now()}`;
    const { data: invite } = await supabaseAdmin
      .from("invites")
      .insert({
        code,
        created_by: adminUserId,
        used_by: regularUserId,
        used_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();
    createdInviteIds.push(invite!.id);

    const caller = makeCaller(adminSession);

    await expect(caller.invite.revoke({ id: invite!.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

describe("invite redemption lifecycle", () => {
  test("valid code can be redeemed exactly once", async () => {
    const caller = makeCaller(adminSession);

    // Generate an invite
    const generated = await caller.invite.generate();
    createdInviteIds.push(generated.id);

    // Sign up a new user with this code
    const publicCaller = makeCaller(null);
    const signUpResult = await publicCaller.auth.signUp({
      email: `redeem-once-${Date.now()}@nonet-test.local`,
      password: "test-password-123!",
      inviteCode: generated.code,
      username: `ro_${Date.now().toString(36)}`,
    });
    createdUserIds.push(signUpResult.user.id);

    // Verify used_by and used_at are populated
    const { data: usedInvite } = await supabaseAdmin
      .from("invites")
      .select("used_by, used_at")
      .eq("id", generated.id)
      .single();
    expect(usedInvite!.used_by).toBe(signUpResult.user.id);
    expect(usedInvite!.used_at).toBeTruthy();

    // Attempting to use the same code again should fail
    await expect(
      publicCaller.auth.signUp({
        email: `redeem-twice-${Date.now()}@nonet-test.local`,
        password: "test-password-123!",
        inviteCode: generated.code,
        username: `rt_${Date.now().toString(36)}`,
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  test("expired code (>24h) is rejected", async () => {
    // Insert an invite that's already expired
    const code = `expired-${Date.now()}`;
    const { data: invite } = await supabaseAdmin
      .from("invites")
      .insert({
        code,
        created_by: adminUserId,
        expires_at: new Date(Date.now() - 60 * 1000).toISOString(), // expired 1 min ago
      })
      .select("id")
      .single();
    createdInviteIds.push(invite!.id);

    const publicCaller = makeCaller(null);
    await expect(
      publicCaller.auth.signUp({
        email: `expired-invite-${Date.now()}@nonet-test.local`,
        password: "test-password-123!",
        inviteCode: code,
        username: `ei_${Date.now().toString(36)}`,
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  test("already-used code is rejected", async () => {
    // Insert a used invite
    const code = `already-used-${Date.now()}`;
    const { data: invite } = await supabaseAdmin
      .from("invites")
      .insert({
        code,
        created_by: adminUserId,
        used_by: regularUserId,
        used_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();
    createdInviteIds.push(invite!.id);

    const publicCaller = makeCaller(null);
    await expect(
      publicCaller.auth.signUp({
        email: `already-used-${Date.now()}@nonet-test.local`,
        password: "test-password-123!",
        inviteCode: code,
        username: `au_${Date.now().toString(36)}`,
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
