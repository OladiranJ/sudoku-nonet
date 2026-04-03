/**
 * Shared test utilities for backend integration tests.
 *
 * These helpers make tests idempotent by cleaning up stale data
 * from previous runs before creating fresh test fixtures.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Delete a test user by email if they already exist in Supabase Auth.
 * Also cleans up related data (profiles, games, follows, etc.).
 */
export async function cleanupTestUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<void> {
  // List users and find by email
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = data?.users?.find((u) => u.email === email);
  if (!existing) return;

  const id = existing.id;

  // Delete related data in dependency order
  await admin.from("notifications").delete().eq("user_id", id);
  await admin.from("achievements").delete().eq("user_id", id);
  await admin.from("challenges").delete().or(`requester_id.eq.${id},opponent_id.eq.${id}`);
  await admin.from("games").delete().eq("user_id", id);
  await admin.from("follows").delete().or(`follower_id.eq.${id},following_id.eq.${id}`);
  await admin.from("invites").delete().eq("used_by", id);
  await admin.from("invites").delete().eq("created_by", id);
  await admin.from("profiles").delete().eq("id", id);
  await admin.auth.admin.deleteUser(id);
}

/**
 * Clean up multiple test users by email.
 */
export async function cleanupTestUsers(
  admin: SupabaseClient,
  emails: string[]
): Promise<void> {
  for (const email of emails) {
    await cleanupTestUserByEmail(admin, email);
  }
}

/**
 * Delete test invites by code prefix pattern.
 */
export async function cleanupTestInvitesByCode(
  admin: SupabaseClient,
  codes: string[]
): Promise<void> {
  for (const code of codes) {
    await admin.from("invites").delete().eq("code", code);
  }
}
