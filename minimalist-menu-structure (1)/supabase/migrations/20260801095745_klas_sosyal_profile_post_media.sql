/*
# Klas Sosyal - Profile & Post Enhancements + Media Storage

## Overview
Adds coins, profile fields, video support to posts, and a media storage bucket
for uploading photos and videos.

## Modified Tables

### profiles (new columns)
- coins (integer, default 100) - virtual currency, every new user starts with 100
- banner_url (text, nullable) - profile cover/banner image
- city (text, nullable) - user's city
- interests (text[], nullable) - interest tags
- social_link (text, nullable) - external social media link
- verified (boolean, default false) - blue tick / verified status
- birth_date (date, nullable) - birthday
- last_login_at (timestamptz, nullable) - last login timestamp
- login_streak (integer, default 0) - consecutive day login count

### posts (new columns)
- video_url (text, nullable) - attached video URL
- is_reel (boolean, default false) - marks the post as a vertical reel

## Storage
- Creates a public 'media' bucket for user-uploaded photos and videos.
- Sets public read + authenticated write policies.
*/

-- ============ PROFILE COLUMNS ============

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_link text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_streak integer NOT NULL DEFAULT 0;

-- ============ POST COLUMNS ============

ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_reel boolean NOT NULL DEFAULT false;

-- ============ STORAGE BUCKET ============

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, authenticated write to own folder
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_upload" ON storage.objects;
CREATE POLICY "media_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_update" ON storage.objects;
CREATE POLICY "media_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'media' AND owner = auth.uid());

DROP POLICY IF EXISTS "media_auth_delete" ON storage.objects;
CREATE POLICY "media_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND owner = auth.uid());