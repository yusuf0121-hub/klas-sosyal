/*
# Klas Sosyal - Theme System & VIP Membership

## Overview
Adds per-user theme customization (background colors/gradients) and VIP membership.
Users can purchase themes with coins; VIP users get access to all premium themes.
Admins can grant/revoke VIP status on any user.

## Changes to existing tables
### profiles (ALTER — additive, no data loss)
- `theme_id` (text, nullable) — the theme identifier the user has applied (e.g. "saf_beyaz", "gece_gun_dogumu"). NULL = default light theme.
- `is_vip` (boolean, default false) — VIP membership flag. VIP users unlock all premium themes for free.

## New Tables
### purchased_themes
- id (uuid, PK)
- user_id (uuid, default auth.uid(), references profiles, cascade) — buyer
- theme_id (text, not null) — the theme identifier purchased
- purchased_at (timestamptz, default now())
- UNIQUE(user_id, theme_id) — one purchase per theme per user

## Security (RLS)
- purchased_themes: owner can read/insert only
- profiles: existing policies remain; is_vip and theme_id are only writable by the user themselves (via update_own_profile) or by admin (via admin_set_vip SECURITY DEFINER function)

## SECURITY DEFINER Functions
- buy_theme(p_theme_id, p_price): deduct coins, record ownership + transaction. VIP users pay 0.
- admin_set_vip(p_user_id, p_is_vip): allows admin to grant/revoke VIP on any user. Checks caller is_admin.
- admin_set_theme(p_user_id, p_theme_id): allows admin to set theme on any user (for testing/support). Checks caller is_admin.
*/

-- ============ ALTER profiles ============

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'theme_id') THEN
    ALTER TABLE profiles ADD COLUMN theme_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_vip') THEN
    ALTER TABLE profiles ADD COLUMN is_vip boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============ purchased_themes table ============

CREATE TABLE IF NOT EXISTS purchased_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  theme_id text NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, theme_id)
);

ALTER TABLE purchased_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_purchased_themes" ON purchased_themes;
CREATE POLICY "read_own_purchased_themes" ON purchased_themes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_purchased_themes" ON purchased_themes;
CREATE POLICY "insert_own_purchased_themes" ON purchased_themes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_purchased_themes_user ON purchased_themes(user_id);

-- ============ SECURITY DEFINER FUNCTIONS ============

CREATE OR REPLACE FUNCTION buy_theme(p_theme_id text, p_price integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_is_vip boolean;
  v_already_owned boolean;
  v_actual_price integer;
BEGIN
  SELECT coins, is_vip INTO v_balance, v_is_vip FROM profiles WHERE id = auth.uid();
  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Kullanıcı bulunamadı.');
  END IF;

  -- VIP users get all themes for free
  IF v_is_vip THEN
    v_actual_price := 0;
  ELSE
    v_actual_price := p_price;
  END IF;

  SELECT EXISTS(SELECT 1 FROM purchased_themes WHERE theme_id = p_theme_id AND user_id = auth.uid())
    INTO v_already_owned;
  IF v_already_owned THEN
    RETURN json_build_object('success', false, 'error', 'Bu temaya zaten sahipsin.');
  END IF;

  IF v_balance < v_actual_price THEN
    RETURN json_build_object('success', false, 'error', 'Yetersiz coin.');
  END IF;

  UPDATE profiles SET coins = coins - v_actual_price WHERE id = auth.uid();
  INSERT INTO purchased_themes (user_id, theme_id) VALUES (auth.uid(), p_theme_id);
  INSERT INTO coin_transactions (user_id, amount, reason, description)
    VALUES (auth.uid(), -v_actual_price, 'theme_buy', p_theme_id || ' teması satın alındı');

  RETURN json_build_object('success', true, 'remaining_coins', v_balance - v_actual_price, 'vip', v_is_vip);
END;
$$;

CREATE OR REPLACE FUNCTION admin_set_vip(p_user_id uuid, p_is_vip boolean)
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

  UPDATE profiles SET is_vip = p_is_vip WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_set_theme(p_user_id uuid, p_theme_id text)
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

  UPDATE profiles SET theme_id = p_theme_id WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$;
