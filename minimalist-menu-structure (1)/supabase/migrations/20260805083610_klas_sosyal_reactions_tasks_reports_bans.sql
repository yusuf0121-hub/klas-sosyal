/*
# Klas Sosyal - Reactions, Saved Posts, Daily Tasks, Reports, Bans

## Overview
Adds Facebook/LinkedIn-style reactions, daily task system with rewards,
content reporting, user banning, and email verification tracking.

## New Tables

### reactions
- id (uuid, PK)
- post_id (uuid, FK to posts, cascade)
- user_id (uuid, default auth.uid(), FK to profiles, cascade)
- type (text, CHECK in 'like','love','wow','funny','sad') — replaces simple like
- created_at (timestamptz)
- UNIQUE(post_id, user_id) — one reaction per user per post

### saved_posts
- id (uuid, PK)
- post_id (uuid, FK to posts, cascade)
- user_id (uuid, default auth.uid(), FK to profiles, cascade)
- created_at (timestamptz)
- UNIQUE(post_id, user_id)

### daily_tasks
- id (uuid, PK)
- user_id (uuid, default auth.uid(), FK to profiles, cascade)
- task_type (text, CHECK in 'post','comment','like','follow','play_game')
- target_count (integer, default 1)
- progress (integer, default 0)
- completed (boolean, default false)
- reward_coins (integer, default 10)
- task_date (date, default current_date) — which day this task is for
- created_at (timestamptz)
- UNIQUE(user_id, task_type, task_date) — one task per type per day

### reports
- id (uuid, PK)
- reporter_id (uuid, default auth.uid(), FK to profiles, cascade)
- post_id (uuid, nullable, FK to posts, cascade) — reported post (nullable for user reports)
- reported_user_id (uuid, nullable, FK to profiles, cascade) — reported user
- reason (text, not null) — report reason
- status (text, CHECK in 'pending','reviewed','resolved','dismissed', default 'pending')
- created_at (timestamptz)

### comment_replies (nested comments)
- Adds parent_comment_id column to existing comments table
- parent_comment_id (uuid, nullable, FK to comments, cascade) — NULL = top-level comment

## Changes to existing tables
### profiles (ALTER — additive)
- is_banned (boolean, default false) — banned users cannot post/comment
- ban_reason (text, nullable) — reason for ban
- banned_until (timestamptz, nullable) — temporary ban expiry; NULL = permanent

## Security (RLS)
- reactions: owner read/insert/delete
- saved_posts: owner read/insert/delete
- daily_tasks: owner read/insert/update
- reports: owner can insert; admin can read all; owner can read own
- comments: existing policies still work (parent_comment_id is just a column)

## SECURITY DEFINER Functions
- toggle_reaction(p_post_id, p_type): upsert reaction, update progress on daily tasks
- complete_daily_task(p_task_type): mark task complete + award coins
- refresh_daily_tasks(): generate today's tasks if not exist
- admin_ban_user(p_user_id, p_reason, p_banned_until): admin bans a user
- admin_unban_user(p_user_id): admin unbans a user
- admin_resolve_report(p_report_id, p_status): admin resolves a report
*/

-- ============ ALTER profiles ============

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_banned') THEN
    ALTER TABLE profiles ADD COLUMN is_banned boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ban_reason') THEN
    ALTER TABLE profiles ADD COLUMN ban_reason text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'banned_until') THEN
    ALTER TABLE profiles ADD COLUMN banned_until timestamptz;
  END IF;
END $$;

-- ============ ALTER comments (add parent_comment_id) ============

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'parent_comment_id') THEN
    ALTER TABLE comments ADD COLUMN parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============ reactions table ============

CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like','love','wow','funny','sad')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_reactions" ON reactions;
CREATE POLICY "read_all_reactions" ON reactions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_reactions" ON reactions;
CREATE POLICY "insert_own_reactions" ON reactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reactions" ON reactions;
CREATE POLICY "update_own_reactions" ON reactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reactions" ON reactions;
CREATE POLICY "delete_own_reactions" ON reactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

-- ============ saved_posts table ============

CREATE TABLE IF NOT EXISTS saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_saved_posts" ON saved_posts;
CREATE POLICY "read_own_saved_posts" ON saved_posts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_posts" ON saved_posts;
CREATE POLICY "insert_own_saved_posts" ON saved_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_posts" ON saved_posts;
CREATE POLICY "delete_own_saved_posts" ON saved_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);

-- ============ daily_tasks table ============

CREATE TABLE IF NOT EXISTS daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('post','comment','like','follow','play_game')),
  target_count integer NOT NULL DEFAULT 1,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  reward_coins integer NOT NULL DEFAULT 10,
  task_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_type, task_date)
);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_daily_tasks" ON daily_tasks;
CREATE POLICY "read_own_daily_tasks" ON daily_tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_daily_tasks" ON daily_tasks;
CREATE POLICY "insert_own_daily_tasks" ON daily_tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_daily_tasks" ON daily_tasks;
CREATE POLICY "update_own_daily_tasks" ON daily_tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);

-- ============ reports table ============

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','reviewed','resolved','dismissed')) DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (post_id IS NOT NULL OR reported_user_id IS NOT NULL)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_own_reports" ON reports;
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "read_own_reports" ON reports;
CREATE POLICY "read_own_reports" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = reporter_id);

-- Admin can read all reports (checked via is_admin in profiles)
DROP POLICY IF EXISTS "admin_read_all_reports" ON reports;
CREATE POLICY "admin_read_all_reports" ON reports FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_reports" ON reports;
CREATE POLICY "admin_update_reports" ON reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- ============ SECURITY DEFINER FUNCTIONS ============

CREATE OR REPLACE FUNCTION toggle_reaction(p_post_id uuid, p_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing reactions%ROWTYPE;
  v_post_owner uuid;
BEGIN
  IF p_type NOT IN ('like','love','wow','funny','sad') THEN
    RETURN json_build_object('success', false, 'error', 'Gecersiz reaksiyon tipi.');
  END IF;

  SELECT * INTO v_existing FROM reactions WHERE post_id = p_post_id AND user_id = auth.uid();

  IF FOUND THEN
    IF v_existing.type = p_type THEN
      -- Same reaction: remove it
      DELETE FROM reactions WHERE id = v_existing.id;
      RETURN json_build_object('success', true, 'action', 'removed');
    ELSE
      -- Different reaction: update it
      UPDATE reactions SET type = p_type WHERE id = v_existing.id;
      RETURN json_build_object('success', true, 'action', 'updated', 'type', p_type);
    END IF;
  ELSE
    -- No existing reaction: insert new
    INSERT INTO reactions (post_id, user_id, type) VALUES (p_post_id, auth.uid(), p_type);

    -- Update daily task progress for 'like'
    IF p_type = 'like' THEN
      UPDATE daily_tasks
        SET progress = LEAST(progress + 1, target_count),
            completed = (progress + 1 >= target_count)
        WHERE user_id = auth.uid()
          AND task_type = 'like'
          AND task_date = current_date
          AND completed = false;
    END IF;

    -- Notify post owner
    SELECT user_id INTO v_post_owner FROM posts WHERE id = p_post_id;
    IF v_post_owner IS NOT NULL AND v_post_owner != auth.uid() THEN
      INSERT INTO notifications (user_id, actor_id, type, post_id)
        VALUES (v_post_owner, auth.uid(), 'like', p_post_id);
    END IF;

    RETURN json_build_object('success', true, 'action', 'added', 'type', p_type);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_daily_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_defs text[] := ARRAY['post','comment','like','follow','play_game'];
  task_target int[] := ARRAY[1, 3, 3, 1, 1];
  task_reward int[] := ARRAY[20, 15, 10, 15, 10];
  i int;
BEGIN
  FOR i IN 1..array_length(task_defs, 1) LOOP
    INSERT INTO daily_tasks (user_id, task_type, target_count, reward_coins)
    VALUES (auth.uid(), task_defs[i], task_target[i], task_reward[i])
    ON CONFLICT (user_id, task_type, task_date) DO NOTHING;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION claim_daily_task_reward(p_task_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task daily_tasks%ROWTYPE;
  v_balance integer;
  v_already_claimed boolean;
BEGIN
  SELECT * INTO v_task FROM daily_tasks WHERE id = p_task_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Görev bulunamadı.');
  END IF;
  IF NOT v_task.completed THEN
    RETURN json_build_object('success', false, 'error', 'Görev henüz tamamlanmadı.');
  END IF;

  -- Check if reward already claimed (progress > target means claimed)
  SELECT EXISTS(
    SELECT 1 FROM coin_transactions
    WHERE user_id = auth.uid()
      AND reason = 'daily_task'
      AND description = v_task.task_type || '_task_' || v_task.task_date::text
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Ödül zaten alındı.');
  END IF;

  UPDATE profiles SET coins = coins + v_task.reward_coins WHERE id = auth.uid()
    RETURNING coins INTO v_balance;

  INSERT INTO coin_transactions (user_id, amount, reason, description)
    VALUES (auth.uid(), v_task.reward_coins, 'daily_task',
      v_task.task_type || '_task_' || v_task.task_date::text);

  RETURN json_build_object('success', true, 'balance', v_balance, 'reward', v_task.reward_coins);
END;
$$;

CREATE OR REPLACE FUNCTION admin_ban_user(p_user_id uuid, p_reason text, p_banned_until timestamptz DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_caller_is_admin FROM profiles WHERE id = auth.uid();
  IF v_caller_is_admin IS NOT TRUE THEN
    RETURN json_build_object('success', false, 'error', 'Yetkisiz.');
  END IF;

  UPDATE profiles
    SET is_banned = true, ban_reason = p_reason, banned_until = p_banned_until
    WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_unban_user(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_caller_is_admin FROM profiles WHERE id = auth.uid();
  IF v_caller_is_admin IS NOT TRUE THEN
    RETURN json_build_object('success', false, 'error', 'Yetkisiz.');
  END IF;

  UPDATE profiles
    SET is_banned = false, ban_reason = NULL, banned_until = NULL
    WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_resolve_report(p_report_id uuid, p_status text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_caller_is_admin FROM profiles WHERE id = auth.uid();
  IF v_caller_is_admin IS NOT TRUE THEN
    RETURN json_build_object('success', false, 'error', 'Yetkisiz.');
  END IF;

  IF p_status NOT IN ('reviewed','resolved','dismissed') THEN
    RETURN json_build_object('success', false, 'error', 'Gecersiz durum.');
  END IF;

  UPDATE reports SET status = p_status WHERE id = p_report_id;
  RETURN json_build_object('success', true);
END;
$$;
