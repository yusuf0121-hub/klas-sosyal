/*
# Klas Sosyal - Auto-create DM on follow

When a user follows someone, a DM conversation is automatically created
between them. No manual "start chat" needed.
*/

-- Function that creates a DM between current user and another user if it doesn't exist
CREATE OR REPLACE FUNCTION ensure_dm(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id uuid;
BEGIN
  -- Check if a DM already exists between these two users
  SELECT c.id INTO v_conv_id
  FROM conversations c
  WHERE c.type = 'dm'
    AND EXISTS (SELECT 1 FROM conversation_members cm1 WHERE cm1.conversation_id = c.id AND cm1.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM conversation_members cm2 WHERE cm2.conversation_id = c.id AND cm2.user_id = p_other_user_id);

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Create new DM conversation
  INSERT INTO conversations (type, created_by)
  VALUES ('dm', auth.uid())
  RETURNING id INTO v_conv_id;

  -- Add both users as members
  INSERT INTO conversation_members (conversation_id, user_id) VALUES
    (v_conv_id, auth.uid()),
    (v_conv_id, p_other_user_id);

  RETURN v_conv_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION ensure_dm(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_dm(uuid) TO authenticated;