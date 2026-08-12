-- Add is_admin column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Create admin auth user with password yusuf0121
-- Using auth.users table directly since we can't use the admin API
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_id FROM auth.users WHERE email = 'yusuf@klas-sosyal.com';
  
  IF admin_id IS NULL THEN
    -- Create the admin user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'yusuf@klas-sosyal.com',
      crypt('yusuf0121', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '{}'::jsonb,
      jsonb_build_object('display_name', 'Yusuf Admin', 'bio', 'Klas Sosyal Yönetici')
    ) RETURNING id INTO admin_id;
  END IF;

  -- Create or update the admin profile
  INSERT INTO profiles (id, display_name, email, bio, is_admin, verified, coins)
  VALUES (admin_id, 'Yusuf Admin', 'yusuf@klas-sosyal.com', 'Klas Sosyal Yönetici', true, true, 100000)
  ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    verified = true,
    coins = 100000;
END $$;