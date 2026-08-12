-- Admin RLS policies: allow admins to manage all content

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Admins can update any profile
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete any profile (via service role only; RLS doesn't block)

-- Admins can delete any post
DROP POLICY IF EXISTS "admin_delete_posts" ON posts;
CREATE POLICY "admin_delete_posts" ON posts FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Admins can delete any comment
DROP POLICY IF EXISTS "admin_delete_comments" ON comments;
CREATE POLICY "admin_delete_comments" ON comments FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Admins can delete any game
DROP POLICY IF EXISTS "admin_delete_games" ON games;
CREATE POLICY "admin_delete_games" ON games FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Admins can delete any message
DROP POLICY IF EXISTS "admin_delete_messages" ON messages;
CREATE POLICY "admin_delete_messages" ON messages FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Admins can update any game
DROP POLICY IF EXISTS "admin_update_games" ON games;
CREATE POLICY "admin_update_games" ON games FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());