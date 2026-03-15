-- 001_initial_schema.sql
-- Creates all tables for the Nonet Sudoku application.

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username      text UNIQUE NOT NULL,
  display_name  text,
  avatar_url    text,
  is_admin      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Completed games
CREATE TABLE IF NOT EXISTS games (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles ON DELETE CASCADE,
  puzzle_seed   text NOT NULL,
  difficulty    text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  time_seconds  integer NOT NULL,
  error_count   integer NOT NULL DEFAULT 0,
  hint_count    integer NOT NULL DEFAULT 0,
  is_daily      boolean NOT NULL DEFAULT false,
  puzzle_date   date,
  completed_at  timestamptz NOT NULL DEFAULT now()
);

-- Social graph
CREATE TABLE IF NOT EXISTS follows (
  follower_id   uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  following_id  uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- Puzzle challenges
CREATE TABLE IF NOT EXISTS challenges (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  challenged_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  puzzle_seed       text NOT NULL,
  difficulty        text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed')),
  challenger_time   integer,
  challenged_time   integer,
  created_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

-- Achievements / badges
CREATE TABLE IF NOT EXISTS achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  badge_id    text NOT NULL,
  earned_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  type        text NOT NULL,
  payload     jsonb,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Invite codes
CREATE TABLE IF NOT EXISTS invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  created_by  uuid REFERENCES profiles ON DELETE SET NULL,
  used_by     uuid REFERENCES profiles ON DELETE SET NULL,
  used_at     timestamptz,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
