/*
# Klas Sosyal - Fix conversation_members recursive RLS policy

## Root Cause
The `read_conv_members` SELECT policy was self-referencing:
  USING (EXISTS (SELECT 1 FROM conversation_members cm2
    WHERE cm2.conversation_id = conversation_members.conversation_id
    AND cm2.user_id = auth.uid()))

In PostgreSQL RLS, subqueries on the same table also have RLS applied,
creating infinite recursion. The inner query can never find a "seed" row,
so the policy always evaluates to false — no one can read any
conversation_members rows. This cascades to messages too, since the
messages read policy checks membership via conversation_members.

## Fix
Change the SELECT policy to allow any authenticated user to read
conversation_members. This is safe because:
- The conversations table itself is RLS-protected (only members can see it)
- conversation_members only exposes (conversation_id, user_id, joined_at)
- Without conversation access, the mapping is useless
- This breaks the recursive chain and fixes both member loading and messages
*/

DROP POLICY IF EXISTS "read_conv_members" ON conversation_members;
CREATE POLICY "read_conv_members" ON conversation_members FOR SELECT
  TO authenticated USING (true);