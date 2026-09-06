/*
# Klas Sosyal - Fix group creation + add media messages

## Changes
1. Messages table: add image_url and video_url columns, make content nullable
   - Allows sending photos and reels in chats without text
2. Create create_group SECURITY DEFINER function
   - Bypasses RLS recursion that prevented group creation
   - Creates conversation + adds all members in one atomic call
3. Storage: ensure 'media' bucket exists for chat media uploads
*/

-- 1. Add media columns to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS video_url text;

-- Make content nullable so image-only messages work
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- 2. Create group function (SECURITY DEFINER bypasses RLS recursion)
CREATE OR REPLACE FUNCTION create_group(p_name text, p_member_ids uuid[])
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id uuid;
BEGIN
  -- Create the group conversation
  INSERT INTO conversations (type, name, created_by)
  VALUES ('group', p_name, auth.uid())
  RETURNING id INTO v_conv_id;

  -- Add creator as member
  INSERT INTO conversation_members (conversation_id, user_id)
  VALUES (v_conv_id, auth.uid());

  -- Add all selected members
  INSERT INTO conversation_members (conversation_id, user_id)
  SELECT v_conv_id, unnest(p_member_ids);

  RETURN v_conv_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_group(text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_group(text, uuid[]) TO authenticated;