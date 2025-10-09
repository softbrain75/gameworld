-- ============================================
-- Migration: Add username column to profiles
-- ============================================

-- 1. Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key
ON public.profiles(username);

-- 3. Update trigger to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, total_points)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(LOWER(NEW.email), LOWER(NEW.raw_user_meta_data->>'email')),
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Grant SELECT on profiles.username for login lookup
-- (RLS policies already allow SELECT for authenticated users)

-- Note: Existing users will have NULL username
-- You may want to create a migration script to set default usernames
-- or force users to set username on next login
