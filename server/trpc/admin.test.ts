/**
 * @jest-environment node
 *
 * Phase 13.1 — Admin route protection integration tests.
 *
 * The full invite CRUD lifecycle (generate/list/revoke/redeem) is tested
 * comprehensively in server/trpc/invite.test.ts. This file focuses on
 * confirming admin-procedure protection from the admin panel's perspective.
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

jest.setTimeout(30_000);

import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import { createCallerFactory } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";
import { createServerClient } from "@/server/db/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createCaller = createCallerFactory(appRouter);

function makeCaller(session: Session | null = null) {
  return createCaller({ session, supabase: createServerClient() });
}

// Track resources for cleanup
const createdUserIds: string[] = [];
const createdInviteIds: string[] = [];

let adminUserId: string;
let adminSession: Session;
let regularUserId: string;
let regularSession: Session;

beforeAll(async () => {
  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Create admin user
  const { data: adminData } = await supabaseAdmin.auth.admin.createUser({
    email: "admin-test-13@nonet-test.local",
    password: "Admin-pw-13!",
    email_confirm: true,
  });
  adminUserId = adminData.user!.id;
  createdUserIds.push(adminUserId);
  await supabaseAdmin.from("profiles").insert({
    id: adminUserId,
    username: "admin_test_13",
    is_admin: true,
  });
  const { data: adminSignIn } = await anonClient.auth.signInWithPassword({
    email: "admin-test-13@nonet-test.local",
    password: "Admin-pw-13!",
  });
  adminSession = adminSignIn.session!;

  // Create regular user
  const { data: regularData } = await supabaseAdmin.auth.admin.createUser({
    email: "regular-test-13@nonet-test.local",
    password: "Regular-pw-13!",
    email_confirm: true,
  });
  regularUserId = regularData.user!.id;
  createdUserIds.push(regularUserId);
  await supabaseAdmin.from("profiles").insert({
    id: regularUserId,
    username: "regular_test_13",
    is_admin: false,
  });
  const { data: regularSignIn } = await anonClient.auth.signInWithPassword({
    email: "regular-test-13@nonet-test.local",
    password: "Regular-pw-13!",
  });
  regularSession = regularSignIn.session!;
});

afterAll(async () => {
  if (createdInviteIds.length > 0) {
    await supabaseAdmin.from("invites").delete().in("id", createdInviteIds);
  }
  await supabaseAdmin.from("invites").delete().eq("created_by", adminUserId);
  for (const userId of createdUserIds) {
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
  }
});

describe("admin route protection — invite procedures", () => {
  test("admin can generate an invite code", async () => {
    const caller = makeCaller(adminSession);
    const result = await caller.invite.generate();

    expect(result.id).toBeTruthy();
    expect(result.code).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/);
    expect(result.expiresAt).toBeTruthy();

    createdInviteIds.push(result.id);
  });

  test("non-admin user is forbidden from generating invite codes", async () => {
    const caller = makeCaller(regularSession);
    await expect(caller.invite.generate()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("unauthenticated user is unauthorized from generating invite codes", async () => {
    const caller = makeCaller(null);
    await expect(caller.invite.generate()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("admin can list invites and each entry has a status field", async () => {
    const caller = makeCaller(adminSession);

    // Generate one so there's definitely something in the list
    const generated = await caller.invite.generate();
    createdInviteIds.push(generated.id);

    const list = await caller.invite.list();
    expect(Array.isArray(list)).toBe(true);

    const entry = list.find((inv: { id: string }) => inv.id === generated.id);
    expect(entry).toBeDefined();
    expect(["pending", "used", "expired"]).toContain(entry!.status);
  });

  test("non-admin cannot list invites", async () => {
    const caller = makeCaller(regularSession);
    await expect(caller.invite.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("admin can revoke an unused invite", async () => {
    const caller = makeCaller(adminSession);
    const generated = await caller.invite.generate();
    createdInviteIds.push(generated.id);

    const result = await caller.invite.revoke({ id: generated.id });
    expect(result.success).toBe(true);
  });

  test("revoking an already-used invite is rejected with BAD_REQUEST", async () => {
    // Insert a pre-used invite directly
    const { data: invite } = await supabaseAdmin
      .from("invites")
      .insert({
        code: `admin-used-${Date.now()}`,
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

describe("profile.getMe — admin flag", () => {
  test("admin user profile includes is_admin: true", async () => {
    const caller = makeCaller(adminSession);
    const me = await caller.profile.getMe();
    expect(me).not.toBeNull();
    expect(me!.is_admin).toBe(true);
  });

  test("regular user profile includes is_admin: false", async () => {
    const caller = makeCaller(regularSession);
    const me = await caller.profile.getMe();
    expect(me).not.toBeNull();
    expect(me!.is_admin).toBe(false);
  });

  test("unauthenticated user cannot call getMe", async () => {
    const caller = makeCaller(null);
    await expect(caller.profile.getMe()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
