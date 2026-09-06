/*
# Klas Sosyal - Fix signup, messaging, and add community games

## Fixes

### 1. Registration fix: auto-create profile on signup
- Creates a trigger on auth.users that automatically inserts a profile row
  when a new user signs up, pulling display_name and bio from user_metadata.
- This eliminates the race condition where the frontend tries to insert a
  profile row before the auth state is fully established.

### 2. Messaging fix: conversation_members INSERT policy
- The old policy required an EXISTS check on conversation_members (which is
  empty for new conversations), blocking the creator from adding other members.
- New policy: creator can add any member to conversations they created,
  without requiring existing members.

### 3. Community games: user-created games
- Adds `created_by` column to games table (nullable, for system games).
- Updates `buy_game` function to pay 80% of the price to the game creator.
- Adds RLS policy for authenticated users to insert games they create.
*/

-- ============ 1. AUTO-CREATE PROFILE ON SIGNUP ============

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Kullanıcı'),
    NEW.email,
    NEW.raw_user_meta_data->>'bio'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============ 2. FIX CONVERSATION_MEMBERS INSERT POLICY ============

DROP POLICY IF EXISTS "insert_conv_members" ON conversation_members;
CREATE POLICY "insert_conv_members" ON conversation_members FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_members.conversation_id
      AND c.created_by = auth.uid()
    )
  );

-- ============ 3. COMMUNITY GAMES ============

ALTER TABLE games ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "read_all_games" ON games;
CREATE POLICY "read_all_games" ON games FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_games" ON games;
CREATE POLICY "insert_own_games" ON games FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_own_games" ON games;
CREATE POLICY "update_own_games" ON games FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "delete_own_games" ON games;
CREATE POLICY "delete_own_games" ON games FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Update buy_game to pay the creator (80% revenue share)
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
  v_creator_cut integer;
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
    VALUES (auth.uid(), -v_game.price, 'game_buy', v_game.title || ' satın alindi');

  -- Pay 80% to the creator if it's a user-created game
  IF v_game.created_by IS NOT NULL AND v_game.price > 0 THEN
    v_creator_cut := FLOOR(v_game.price * 0.8);
    UPDATE profiles SET coins = coins + v_creator_cut WHERE id = v_game.created_by;
    INSERT INTO coin_transactions (user_id, amount, reason, description)
      VALUES (v_game.created_by, v_creator_cut, 'purchase', v_game.title || ' satis geliri');
  END IF;

  RETURN json_build_object('success', true, 'remaining_coins', v_balance - v_game.price);
END;
$$;