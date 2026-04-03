/**
 * @jest-environment node
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cleanupTestUsers } from "@/server/test-utils";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load .env.local — walk up to find repo root (handles worktrees)
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Admin client (service_role) — bypasses RLS
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Helper: run raw SQL via exec_sql function
async function execSQL(sql: string): Promise<void> {
  const { error } = await admin.rpc("exec_sql", { sql });
  if (error) throw new Error(`SQL error: ${error.message}`);
}

// Helper: query information_schema for table columns via RPC
async function getTableColumns(
  tableName: string
): Promise<{ column_name: string; data_type: string; is_nullable: string }[]> {
  const { data, error } = await admin.rpc("get_table_columns", {
    p_table: tableName,
  });
  if (error) {
    throw new Error(`Cannot query columns for ${tableName}: ${error.message}`);
  }
  return data || [];
}

// ============================================================
// Setup: create a view for information_schema access via REST
// ============================================================
beforeAll(async () => {
  // Create helper functions that return data (since exec_sql returns void)
  await execSQL(`
    CREATE OR REPLACE FUNCTION get_table_columns(p_table text)
    RETURNS TABLE(column_name text, data_type text, is_nullable text)
    LANGUAGE sql SECURITY DEFINER STABLE
    AS $$
      SELECT column_name::text, data_type::text, is_nullable::text
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = p_table;
    $$;
  `);

  await execSQL(`
    CREATE OR REPLACE FUNCTION get_rls_status()
    RETURNS TABLE(tablename text, rowsecurity boolean)
    LANGUAGE sql SECURITY DEFINER STABLE
    AS $$
      SELECT tablename::text, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public';
    $$;
  `);

  // Reload PostgREST schema cache so it picks up the new functions
  await execSQL("NOTIFY pgrst, 'reload schema';");

  // Wait briefly for schema cache reload
  await new Promise((resolve) => setTimeout(resolve, 2000));
});

afterAll(async () => {
  // Clean up helper functions
  await execSQL("DROP FUNCTION IF EXISTS get_table_columns(text);");
  await execSQL("DROP FUNCTION IF EXISTS get_rls_status();");
  await execSQL("NOTIFY pgrst, 'reload schema';");
});

// ============================================================
// Schema verification tests
// ============================================================
describe("Schema — tables exist", () => {
  const EXPECTED_TABLES = [
    "profiles",
    "games",
    "follows",
    "challenges",
    "achievements",
    "notifications",
    "invites",
  ];

  test.each(EXPECTED_TABLES)("table '%s' exists", async (tableName) => {
    const { error } = await admin.from(tableName).select("*").limit(0);
    expect(error).toBeNull();
  });
});

describe("Schema — games table columns", () => {
  test("games table has is_daily boolean column", async () => {
    const columns = await getTableColumns("games");
    const isDaily = columns.find((c) => c.column_name === "is_daily");
    expect(isDaily).toBeDefined();
    expect(isDaily!.data_type).toBe("boolean");
    expect(isDaily!.is_nullable).toBe("NO");
  });

  test("games table has puzzle_date date column", async () => {
    const columns = await getTableColumns("games");
    const puzzleDate = columns.find((c) => c.column_name === "puzzle_date");
    expect(puzzleDate).toBeDefined();
    expect(puzzleDate!.data_type).toBe("date");
  });
});

describe("Schema — RLS enabled on all tables", () => {
  const EXPECTED_TABLES = [
    "profiles",
    "games",
    "follows",
    "challenges",
    "achievements",
    "notifications",
    "invites",
  ];

  test("all tables have RLS enabled", async () => {
    const { data, error } = await admin.rpc("get_rls_status");

    expect(error).toBeNull();
    expect(data).toBeDefined();

    for (const table of EXPECTED_TABLES) {
      const row = (data as { tablename: string; rowsecurity: boolean }[]).find(
        (r) => r.tablename === table
      );
      expect(row).toBeDefined();
      expect(row!.rowsecurity).toBe(true);
    }
  });
});

// ============================================================
// RLS policy tests
// ============================================================
describe("RLS policies", () => {
  let userAId: string;
  let userBId: string;
  let userAClient: SupabaseClient;
  let userBClient: SupabaseClient;

  beforeAll(async () => {
    // Clean up stale data from previous runs
    await cleanupTestUsers(admin, [
      "test-user-a@nonet-test.local",
      "test-user-b@nonet-test.local",
    ]);

    // Create two test users via admin API
    const { data: userAData, error: errA } =
      await admin.auth.admin.createUser({
        email: "test-user-a@nonet-test.local",
        password: "test-password-123!",
        email_confirm: true,
      });
    if (errA) throw new Error(`Failed to create user A: ${errA.message}`);
    userAId = userAData.user.id;

    const { data: userBData, error: errB } =
      await admin.auth.admin.createUser({
        email: "test-user-b@nonet-test.local",
        password: "test-password-456!",
        email_confirm: true,
      });
    if (errB) throw new Error(`Failed to create user B: ${errB.message}`);
    userBId = userBData.user.id;

    // Create profiles for both users (via service_role, bypasses RLS)
    await admin.from("profiles").insert([
      { id: userAId, username: "test_user_a" },
      { id: userBId, username: "test_user_b" },
    ]);

    // Sign in as each user to get authenticated clients
    const { data: sessionA, error: signInErrA } =
      await createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false },
      }).auth.signInWithPassword({
        email: "test-user-a@nonet-test.local",
        password: "test-password-123!",
      });
    if (signInErrA)
      throw new Error(`Failed to sign in user A: ${signInErrA.message}`);

    const { data: sessionB, error: signInErrB } =
      await createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false },
      }).auth.signInWithPassword({
        email: "test-user-b@nonet-test.local",
        password: "test-password-456!",
      });
    if (signInErrB)
      throw new Error(`Failed to sign in user B: ${signInErrB.message}`);

    // Create authenticated clients with user tokens
    userAClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${sessionA.session!.access_token}`,
        },
      },
    });

    userBClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${sessionB.session!.access_token}`,
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up: delete test data and users
    await admin.from("notifications").delete().in("user_id", [userAId, userBId]);
    await admin.from("games").delete().in("user_id", [userAId, userBId]);
    await admin.from("profiles").delete().in("id", [userAId, userBId]);
    await admin.auth.admin.deleteUser(userAId);
    await admin.auth.admin.deleteUser(userBId);
  });

  // ---- profiles RLS ----
  test("user A can read own profile", async () => {
    const { data, error } = await userAClient
      .from("profiles")
      .select("*")
      .eq("id", userAId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.username).toBe("test_user_a");
  });

  test("user A cannot update user B's profile", async () => {
    const { error } = await userAClient
      .from("profiles")
      .update({ display_name: "Hacked!" })
      .eq("id", userBId);

    // RLS should prevent this — either error or 0 rows affected
    // PostgREST returns 0 rows with no error when RLS blocks the update
    if (!error) {
      // Verify no change was made
      const { data } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", userBId)
        .single();
      expect(data!.display_name).not.toBe("Hacked!");
    }
  });

  // ---- games RLS ----
  test("user A can insert own game", async () => {
    const { error } = await userAClient.from("games").insert({
      user_id: userAId,
      puzzle_seed: "test-seed-abc",
      difficulty: "easy",
      time_seconds: 120,
      error_count: 0,
      hint_count: 0,
      is_daily: false,
    });

    expect(error).toBeNull();
  });

  test("user A cannot insert game for user B", async () => {
    const { error } = await userAClient.from("games").insert({
      user_id: userBId,
      puzzle_seed: "test-seed-xyz",
      difficulty: "medium",
      time_seconds: 180,
      error_count: 1,
      hint_count: 0,
      is_daily: false,
    });

    expect(error).not.toBeNull();
  });

  // ---- notifications RLS ----
  test("user A can read own notifications", async () => {
    // Insert a notification for user A via admin
    await admin.from("notifications").insert({
      user_id: userAId,
      type: "test",
      payload: { message: "hello" },
    });

    const { data, error } = await userAClient
      .from("notifications")
      .select("*")
      .eq("user_id", userAId);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  test("user A cannot read user B's notifications", async () => {
    // Insert a notification for user B via admin
    await admin.from("notifications").insert({
      user_id: userBId,
      type: "test",
      payload: { message: "private" },
    });

    const { data, error } = await userBClient
      .from("notifications")
      .select("*")
      .eq("user_id", userBId);

    // User B should see their own notifications
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);

    // User A should NOT see user B's notifications
    const { data: leaked } = await userAClient
      .from("notifications")
      .select("*")
      .eq("user_id", userBId);

    expect(leaked).toEqual([]);
  });
});
