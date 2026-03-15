-- 002_rls_policies.sql
-- Enable Row Level Security and create policies for all tables.

-- ============================================================
-- profiles: public read, own-write only
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- games: public read, insert own only
-- ============================================================
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select" ON games
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "games_insert" ON games
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- follows: public read, own-write only (follower_id = self)
-- ============================================================
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select" ON follows
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "follows_insert" ON follows
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete" ON follows
  FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

-- ============================================================
-- challenges: read if participant, insert own only
-- ============================================================
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_select" ON challenges
  FOR SELECT TO authenticated
  USING (auth.uid() IN (challenger_id, challenged_id));

CREATE POLICY "challenges_insert" ON challenges
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = challenger_id);

-- ============================================================
-- achievements: public read, no client insert (service_role only)
-- ============================================================
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_select" ON achievements
  FOR SELECT TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for authenticated role.
-- Achievements are granted server-side via service_role.

-- ============================================================
-- notifications: own read/write only
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- invites: admin-only write, server-side read for validation
-- ============================================================
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_insert" ON invites
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Server reads invites via service_role for validation.
-- No SELECT policy for regular authenticated users.
