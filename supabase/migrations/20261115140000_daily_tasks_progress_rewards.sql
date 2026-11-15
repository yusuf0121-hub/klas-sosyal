ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 100;

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  video_url text,
  is_reel boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'love', 'wow', 'funny', 'sad')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('post', 'comment', 'like', 'follow', 'play_game')),
  target_count integer NOT NULL DEFAULT 1 CHECK (target_count > 0),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0),
  completed boolean NOT NULL DEFAULT false,
  reward_coins integer NOT NULL DEFAULT 10 CHECK (reward_coins >= 0),
  task_date date NOT NULL DEFAULT current_date,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_type, task_date)
);

ALTER TABLE public.daily_tasks ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON public.daily_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_created ON public.coin_transactions(user_id, created_at DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_read_authenticated ON public.posts;
CREATE POLICY posts_read_authenticated ON public.posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS posts_insert_own ON public.posts;
CREATE POLICY posts_insert_own ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS posts_update_own ON public.posts;
CREATE POLICY posts_update_own ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS posts_delete_own ON public.posts;
CREATE POLICY posts_delete_own ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS comments_read_authenticated ON public.comments;
CREATE POLICY comments_read_authenticated ON public.comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS comments_insert_own ON public.comments;
CREATE POLICY comments_insert_own ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS comments_delete_own ON public.comments;
CREATE POLICY comments_delete_own ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS reactions_read_authenticated ON public.reactions;
CREATE POLICY reactions_read_authenticated ON public.reactions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS reactions_insert_own ON public.reactions;
CREATE POLICY reactions_insert_own ON public.reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS reactions_update_own ON public.reactions;
CREATE POLICY reactions_update_own ON public.reactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS reactions_delete_own ON public.reactions;
CREATE POLICY reactions_delete_own ON public.reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS daily_tasks_read_own ON public.daily_tasks;
CREATE POLICY daily_tasks_read_own ON public.daily_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS coin_transactions_read_own ON public.coin_transactions;
CREATE POLICY coin_transactions_read_own ON public.coin_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.advance_daily_task(p_user_id uuid, p_task_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_target integer;
  v_reward integer;
BEGIN
  IF p_user_id IS NULL OR p_task_type NOT IN ('post', 'comment', 'like', 'follow', 'play_game') THEN
    RETURN;
  END IF;

  v_target := CASE p_task_type WHEN 'comment' THEN 3 WHEN 'like' THEN 3 ELSE 1 END;
  v_reward := CASE p_task_type WHEN 'post' THEN 20 WHEN 'comment' THEN 15 WHEN 'like' THEN 10 WHEN 'follow' THEN 15 ELSE 10 END;

  INSERT INTO public.daily_tasks (user_id, task_type, target_count, reward_coins)
  VALUES (p_user_id, p_task_type, v_target, v_reward)
  ON CONFLICT (user_id, task_type, task_date) DO NOTHING;

  UPDATE public.daily_tasks
  SET progress = LEAST(progress + 1, target_count),
      completed = (progress + 1 >= target_count)
  WHERE user_id = p_user_id
    AND task_type = p_task_type
    AND task_date = CURRENT_DATE
    AND claimed_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_daily_task_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_task_type text;
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    v_user_id := NEW.user_id;
    v_task_type := 'post';
  ELSIF TG_TABLE_NAME = 'comments' THEN
    v_user_id := NEW.user_id;
    v_task_type := 'comment';
  ELSIF TG_TABLE_NAME = 'reactions' THEN
    IF NEW.type <> 'like' THEN RETURN NEW; END IF;
    v_user_id := NEW.user_id;
    v_task_type := 'like';
  ELSIF TG_TABLE_NAME = 'follows' THEN
    v_user_id := NEW.follower_id;
    v_task_type := 'follow';
  END IF;

  PERFORM public.advance_daily_task(v_user_id, v_task_type);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS track_daily_task_post ON public.posts;
CREATE TRIGGER track_daily_task_post AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.track_daily_task_activity();
DROP TRIGGER IF EXISTS track_daily_task_comment ON public.comments;
CREATE TRIGGER track_daily_task_comment AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.track_daily_task_activity();
DROP TRIGGER IF EXISTS track_daily_task_reaction ON public.reactions;
CREATE TRIGGER track_daily_task_reaction AFTER INSERT ON public.reactions
FOR EACH ROW EXECUTE FUNCTION public.track_daily_task_activity();
DROP TRIGGER IF EXISTS track_daily_task_follow ON public.follows;
CREATE TRIGGER track_daily_task_follow AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.track_daily_task_activity();

CREATE OR REPLACE FUNCTION public.refresh_daily_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  INSERT INTO public.daily_tasks (user_id, task_type, target_count, reward_coins)
  VALUES
    (v_user_id, 'post', 1, 20),
    (v_user_id, 'comment', 3, 15),
    (v_user_id, 'like', 3, 10),
    (v_user_id, 'follow', 1, 15),
    (v_user_id, 'play_game', 1, 10)
  ON CONFLICT (user_id, task_type, task_date) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_daily_task_reward(p_task_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_task public.daily_tasks%ROWTYPE;
  v_balance integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oturum açmalısın.');
  END IF;

  SELECT * INTO v_task
  FROM public.daily_tasks
  WHERE id = p_task_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Görev bulunamadı.');
  END IF;
  IF NOT v_task.completed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Görev henüz tamamlanmadı.');
  END IF;
  IF v_task.claimed_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ödül zaten alındı.');
  END IF;

  UPDATE public.daily_tasks SET claimed_at = now() WHERE id = v_task.id;
  UPDATE public.profiles SET coins = COALESCE(coins, 0) + v_task.reward_coins
  WHERE id = auth.uid() RETURNING coins INTO v_balance;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  INSERT INTO public.coin_transactions (user_id, amount, reason, description)
  VALUES (auth.uid(), v_task.reward_coins, 'daily_task', v_task.task_type || '_task_' || v_task.task_date::text);

  RETURN jsonb_build_object('success', true, 'balance', v_balance, 'reward', v_task.reward_coins);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_game_play()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oturum açmalısın.');
  END IF;
  PERFORM public.advance_daily_task(auth.uid(), 'play_game');
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_reaction(p_post_id uuid, p_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing public.reactions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR p_type NOT IN ('like', 'love', 'wow', 'funny', 'sad') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geçersiz işlem.');
  END IF;

  SELECT * INTO v_existing FROM public.reactions
  WHERE post_id = p_post_id AND user_id = auth.uid();

  IF FOUND THEN
    IF v_existing.type = p_type THEN
      DELETE FROM public.reactions WHERE id = v_existing.id;
      RETURN jsonb_build_object('success', true, 'action', 'removed');
    END IF;
    UPDATE public.reactions SET type = p_type WHERE id = v_existing.id;
    RETURN jsonb_build_object('success', true, 'action', 'updated', 'type', p_type);
  END IF;

  INSERT INTO public.reactions (post_id, user_id, type)
  VALUES (p_post_id, auth.uid(), p_type);
  RETURN jsonb_build_object('success', true, 'action', 'added', 'type', p_type);
END;
$$;

REVOKE ALL ON FUNCTION public.advance_daily_task(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.track_daily_task_activity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_daily_tasks() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_daily_task_reward(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_game_play() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.toggle_reaction(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_daily_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_task_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_game_play() TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_reaction(uuid, text) TO authenticated;
