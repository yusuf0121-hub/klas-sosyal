/*
# Klas Sosyal - Games, User Games, Coin Transactions, Badges

## Overview
Adds a games store, user game ownership, coin transaction history, and a badge
system tracking which user has earned which badge.

## New Tables

### games
- id (uuid, PK)
- title (text, not null) - game name
- description (text) - game description
- price (integer, not null, default 0) - price in coins
- thumbnail_url (text) - game thumbnail image
- category (text) - game category
- slug (text, unique) - URL-friendly identifier for playable game
- created_at (timestamptz)

### user_games
- id (uuid, PK)
- game_id (uuid, references games, cascade)
- user_id (uuid, default auth.uid(), references profiles, cascade)
- purchased_at (timestamptz, default now())
- UNIQUE(game_id, user_id)

### coin_transactions
- id (uuid, PK)
- user_id (uuid, default auth.uid(), references profiles, cascade)
- amount (integer, not null)
- reason (text)
- description (text, nullable)
- created_at (timestamptz)

### user_badges
- id (uuid, PK)
- user_id (uuid, default auth.uid(), references profiles, cascade)
- badge_id (integer, not null)
- awarded_at (timestamptz, default now())
- UNIQUE(user_id, badge_id)

## Security (RLS)
All tables have RLS enabled.
- games: public read
- user_games: owner read/insert
- coin_transactions: owner read only; inserts via SECURITY DEFINER
- user_badges: owner read only; inserts via SECURITY DEFINER

## SECURITY DEFINER Functions
- buy_game(game_id): deduct coins, record ownership + transaction
- add_coins(amount, description): add coins + transaction (for coin pack purchases)
- award_badge(badge_id): idempotently award a badge to the current user
*/

-- ============ TABLES ============

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price integer NOT NULL DEFAULT 0,
  thumbnail_url text,
  category text,
  slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id integer NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_user_games_user ON user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- ============ RLS ============

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Games
DROP POLICY IF EXISTS "read_all_games" ON games;
CREATE POLICY "read_all_games" ON games FOR SELECT
  TO authenticated USING (true);

-- User games
DROP POLICY IF EXISTS "read_own_user_games" ON user_games;
CREATE POLICY "read_own_user_games" ON user_games FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_games" ON user_games;
CREATE POLICY "insert_own_user_games" ON user_games FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Coin transactions
DROP POLICY IF EXISTS "read_own_coin_tx" ON coin_transactions;
CREATE POLICY "read_own_coin_tx" ON coin_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- User badges
DROP POLICY IF EXISTS "read_own_badges" ON user_badges;
CREATE POLICY "read_own_badges" ON user_badges FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- ============ SECURITY DEFINER FUNCTIONS ============

CREATE OR REPLACE FUNCTION buy_game(p_game_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game games%ROWTYPE;
  v_balance integer;
  v_already_owned boolean;
BEGIN
  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Oyun bulunamadı.');
  END IF;

  SELECT coins INTO v_balance FROM profiles WHERE id = auth.uid();
  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Kullanıcı bulunamadı.');
  END IF;

  SELECT EXISTS(SELECT 1 FROM user_games WHERE game_id = p_game_id AND user_id = auth.uid())
    INTO v_already_owned;
  IF v_already_owned THEN
    RETURN json_build_object('success', false, 'error', 'Bu oyuna zaten sahipsin.');
  END IF;

  IF v_balance < v_game.price THEN
    RETURN json_build_object('success', false, 'error', 'Yetersiz coin.');
  END IF;

  UPDATE profiles SET coins = coins - v_game.price WHERE id = auth.uid();
  INSERT INTO user_games (game_id, user_id) VALUES (p_game_id, auth.uid());
  INSERT INTO coin_transactions (user_id, amount, reason, description)
    VALUES (auth.uid(), -v_game.price, 'game_buy', v_game.title || ' satın alındi');

  RETURN json_build_object('success', true, 'remaining_coins', v_balance - v_game.price);
END;
$$;

CREATE OR REPLACE FUNCTION add_coins(p_amount integer, p_description text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Gecersiz miktar.');
  END IF;

  UPDATE profiles SET coins = coins + p_amount WHERE id = auth.uid()
    RETURNING coins INTO v_balance;

  INSERT INTO coin_transactions (user_id, amount, reason, description)
    VALUES (auth.uid(), p_amount, 'purchase', COALESCE(p_description, 'Coin paketi satinalindi'));

  RETURN json_build_object('success', true, 'balance', v_balance);
END;
$$;

CREATE OR REPLACE FUNCTION award_badge(p_badge_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (auth.uid(), p_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
END;
$$;