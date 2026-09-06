/*
# Klas Sosyal - Storage bucket for avatars and banners

## Overview
Creates a public storage bucket for user avatar and banner image uploads.

## Storage
- Bucket: avatars (public)
- Policies: authenticated users can upload to their own folder, everyone can read
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to avatars bucket
DROP POLICY IF EXISTS "auth_upload_avatars" ON storage.objects;
CREATE POLICY "auth_upload_avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update their own files
DROP POLICY IF EXISTS "auth_update_avatars" ON storage.objects;
CREATE POLICY "auth_update_avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');
