/*
# Klas Sosyal - Conversations, Messages, Saves, Shares, Calls

## Overview
Adds messaging (DM + group chats), saved posts, shared posts, and call history.

## New Tables

### conversations
- id (uuid, PK)
- type (text: 'dm' or 'group') - direct message or group chat
- name (text, nullable) - group name (null for DMs)
- avatar_url (text, nullable) - group avatar
- created_by (uuid, default auth.uid()) - who created the conversation
- created_at (timestamptz)

### conversation_members
- id (uuid, PK)
- conversation_id (uuid, references conversations, cascade)
- user_id (uuid, references profiles, cascade)
- joined_at (timestamptz)
- UNIQUE(conversation_id, user_id)

### messages
- id (uuid, PK)
- conversation_id (uuid, references conversations, cascade)
- sender_id (uuid, default auth.uid(), references profiles, cascade)
- content (text, not null)
- created_at (timestamptz)

### saved_posts
- id (uuid, PK)
- post_id (uuid, references posts, cascade)
- user_id (uuid, default auth.uid(), references profiles, cascade)
- created_at (timestamptz)
- UNIQUE(post_id, user_id)

### shares
- id (uuid, PK)
- post_id (uuid, references posts, cascade)
- user_id (uuid, default auth.uid(), references profiles, cascade)
- created_at (timestamptz)

### calls
- id (uuid, PK)
- conversation_id (uuid, references conversations, cascade)
- caller_id (uuid, default auth.uid(), references profiles, cascade)
- status (text: 'initiated', 'accepted', 'ended', 'missed')
- started_at (timestamptz, default now())
- ended_at (timestamptz, nullable)

## Security (RLS)
All tables have RLS enabled.
- conversations: members can read; authenticated can insert (creator)
- conversation_members: members can read; authenticated can insert self; creators can delete members
- messages: members can read; members can insert
- saved_posts: owner-only CRUD
- shares: all can read; owner-only insert
- calls: members can read; caller can insert/update
*/

-- ============ TABLES ============

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('dm', 'group')),
  name text,
  avatar_url text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  caller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'accepted', 'ended', 'missed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz DEFAULT now()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_conversation_members_conv ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_post ON shares(post_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_conv ON calls(conversation_id);

-- ============ RLS ============

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Conversations
DROP POLICY IF EXISTS "read_conversations" ON conversations;
CREATE POLICY "read_conversations" ON conversations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_members.conversation_id = conversations.id AND conversation_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_conversations" ON conversations;
CREATE POLICY "insert_conversations" ON conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_conversations" ON conversations;
CREATE POLICY "update_conversations" ON conversations FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Conversation members
DROP POLICY IF EXISTS "read_conv_members" ON conversation_members;
CREATE POLICY "read_conv_members" ON conversation_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM conversation_members cm2 WHERE cm2.conversation_id = conversation_members.conversation_id AND cm2.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_conv_members" ON conversation_members;
CREATE POLICY "insert_conv_members" ON conversation_members FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM conversations c JOIN conversation_members cm ON cm.conversation_id = c.id WHERE c.id = conversation_members.conversation_id AND c.created_by = auth.uid())
  );

DROP POLICY IF EXISTS "delete_conv_members" ON conversation_members;
CREATE POLICY "delete_conv_members" ON conversation_members FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_members.conversation_id AND c.created_by = auth.uid())
  );

-- Messages
DROP POLICY IF EXISTS "read_messages" ON messages;
CREATE POLICY "read_messages" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_members.conversation_id = messages.conversation_id AND conversation_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_messages" ON messages;
CREATE POLICY "insert_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_members.conversation_id = messages.conversation_id AND conversation_members.user_id = auth.uid())
  );

-- Saved posts
DROP POLICY IF EXISTS "read_own_saved" ON saved_posts;
CREATE POLICY "read_own_saved" ON saved_posts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved" ON saved_posts;
CREATE POLICY "insert_own_saved" ON saved_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved" ON saved_posts;
CREATE POLICY "delete_own_saved" ON saved_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Shares
DROP POLICY IF EXISTS "read_all_shares" ON shares;
CREATE POLICY "read_all_shares" ON shares FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_shares" ON shares;
CREATE POLICY "insert_own_shares" ON shares FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Calls
DROP POLICY IF EXISTS "read_calls" ON calls;
CREATE POLICY "calls_read" ON calls FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_members.conversation_id = calls.conversation_id AND conversation_members.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "read_calls" ON calls;
DROP POLICY IF EXISTS "calls_read" ON calls;
CREATE POLICY "calls_read" ON calls FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_members.conversation_id = calls.conversation_id AND conversation_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_calls" ON calls;
CREATE POLICY "calls_insert" ON calls FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = caller_id);
DROP POLICY IF EXISTS "insert_calls" ON calls;
DROP POLICY IF EXISTS "calls_insert" ON calls;
CREATE POLICY "calls_insert" ON calls FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = caller_id);

DROP POLICY IF EXISTS "update_calls" ON calls;
CREATE POLICY "calls_update" ON calls FOR UPDATE
  TO authenticated USING (auth.uid() = caller_id) WITH CHECK (auth.uid() = caller_id);
DROP POLICY IF EXISTS "update_calls" ON calls;
DROP POLICY IF EXISTS "calls_update" ON calls;
CREATE POLICY "calls_update" ON calls FOR UPDATE
  TO authenticated USING (auth.uid() = caller_id) WITH CHECK (auth.uid() = caller_id);