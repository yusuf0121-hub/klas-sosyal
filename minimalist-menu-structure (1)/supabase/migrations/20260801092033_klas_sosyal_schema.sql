/*
# Klas Sosyal - Social Media Database Schema

## Overview
Creates the complete database schema for Klas Sosyal, a social media application
with user profiles, posts, likes, comments, follows, and notifications.

## New Tables

### profiles
- id (uuid, PK, references auth.users) - user's auth ID, set on signup
- display_name (text, not null) - user's display name (from signup form)
- email (text) - user's email
- bio (text, nullable) - optional bio (from signup form)
- avatar_url (text, nullable) - profile image URL
- created_at (timestamptz) - account creation time

### posts
- id (uuid, PK)
- user_id (uuid, references profiles, default auth.uid()) - post author
- content (text, not null) - post text content
- image_url (text, nullable) - optional attached image URL
- created_at (timestamptz) - post creation time

### likes
- id (uuid, PK)
- post_id (uuid, references posts, cascade delete) - liked post
- user_id (uuid, default auth.uid()) - who liked
- created_at (timestamptz)
- UNIQUE(post_id, user_id) - one like per user per post

### comments
- id (uuid, PK)
- post_id (uuid, references posts, cascade delete) - commented post
- user_id (uuid, default auth.uid()) - who commented
- content (text, not null) - comment text
- created_at (timestamptz)

### follows
- id (uuid, PK)
- follower_id (uuid, default auth.uid()) - who follows
- following_id (uuid, references profiles) - who is followed
- created_at (timestamptz)
- UNIQUE(follower_id, following_id) - one follow per pair

### notifications
- id (uuid, PK)
- user_id (uuid) - notification recipient
- actor_id (uuid) - who triggered the notification
- type (text) - 'like', 'comment', or 'follow'
- post_id (uuid, nullable) - related post (for like/comment)
- read (boolean, default false) - whether notification has been read
- created_at (timestamptz)

## Security (RLS)
All tables have RLS enabled.
- profiles: all authenticated users can read all; users insert/update only their own
- posts: all authenticated users can read all; users insert/update/delete only their own
- likes: all authenticated users can read all; users insert/delete only their own
- comments: all authenticated users can read all; users insert/delete only their own
- follows: all authenticated users can read all; users insert/delete only their own
- notifications: users can read/update only their own (inserts only via triggers)

## Triggers (SECURITY DEFINER, bypass RLS to insert notifications)
- notify_on_like: creates a 'like' notification when a user likes a post (skips self-likes)
- notify_on_comment: creates a 'comment' notification when a user comments (skips self-comments)
- notify_on_follow: creates a 'follow' notification when a user follows another (skips self-follows)

## Indexes
- posts(user_id), posts(created_at DESC)
- likes(post_id), likes(user_id)
- comments(post_id), comments(user_id)
- follows(follower_id), follows(following_id)
- notifications(user_id), notifications(read)
*/

-- ============ TABLES ============

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  email text,
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============ RLS ============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
CREATE POLICY "read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Posts policies
DROP POLICY IF EXISTS "read_all_posts" ON posts;
CREATE POLICY "read_all_posts" ON posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_posts" ON posts;
CREATE POLICY "insert_own_posts" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_posts" ON posts;
CREATE POLICY "update_own_posts" ON posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_posts" ON posts;
CREATE POLICY "delete_own_posts" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Likes policies
DROP POLICY IF EXISTS "read_all_likes" ON likes;
CREATE POLICY "read_all_likes" ON likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_likes" ON likes;
CREATE POLICY "insert_own_likes" ON likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_likes" ON likes;
CREATE POLICY "delete_own_likes" ON likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Comments policies
DROP POLICY IF EXISTS "read_all_comments" ON comments;
CREATE POLICY "read_all_comments" ON comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_comments" ON comments;
CREATE POLICY "insert_own_comments" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_comments" ON comments;
CREATE POLICY "delete_own_comments" ON comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Follows policies
DROP POLICY IF EXISTS "read_all_follows" ON follows;
CREATE POLICY "read_all_follows" ON follows FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_follows" ON follows;
CREATE POLICY "insert_own_follows" ON follows FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "delete_own_follows" ON follows;
CREATE POLICY "delete_own_follows" ON follows FOR DELETE
  TO authenticated USING (auth.uid() = follower_id);

-- Notifications policies (read/update only; inserts happen via SECURITY DEFINER triggers)
DROP POLICY IF EXISTS "read_own_notifications" ON notifications;
CREATE POLICY "read_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ NOTIFICATION TRIGGERS ============

CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, post_id)
  SELECT p.user_id, NEW.user_id, 'like', NEW.post_id
  FROM posts p
  WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, post_id)
  SELECT p.user_id, NEW.user_id, 'comment', NEW.post_id
  FROM posts p
  WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.following_id != NEW.follower_id THEN
    INSERT INTO notifications (user_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_like ON likes;
CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

DROP TRIGGER IF EXISTS trigger_notify_on_comment ON comments;
CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

DROP TRIGGER IF EXISTS trigger_notify_on_follow ON follows;
CREATE TRIGGER trigger_notify_on_follow
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();