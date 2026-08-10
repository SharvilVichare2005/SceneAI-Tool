-- ==============================================================================
-- LabellingApp - Supabase Authentication & RBAC Schema
-- Project URL: https://tfhyeamkietfqmbylyqt.supabase.co
-- Super Admin: sharvilvichare2704@gmail.com
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. Create the public profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Policy: Authenticated users can view all profiles in the workspace
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert their own profile upon login/registration
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile info (e.g., name, avatar)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admins can update any user profile (e.g. promote/demote roles)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR auth.jwt()->>'email' = 'sharvilvichare2704@gmail.com'
  );

-- Policy: Allow service role / triggers full access
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
CREATE POLICY "Service role full access"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true);

-- 4. Trigger function to automatically create/update a profile on user signup & Google OAuth login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  -- Sharvil Vichare is the Super Administrator
  IF LOWER(NEW.email) = 'sharvilvichare2704@gmail.com' THEN
    assigned_role := 'admin';
    user_name := 'Sharvil Vichare';
  ELSE
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
    IF assigned_role NOT IN ('admin', 'user') THEN
      assigned_role := 'user';
    END IF;

    user_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1)
    );
  END IF;

  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'avatar'
  );

  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    assigned_role,
    user_avatar
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    role = CASE WHEN LOWER(EXCLUDED.email) = 'sharvilvichare2704@gmail.com' THEN 'admin' ELSE public.profiles.role END,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach the trigger to auth.users (triggers on both INSERT and UPDATE)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Ensure sharvilvichare2704@gmail.com is set as Admin if already existing
UPDATE public.profiles
SET role = 'admin', full_name = 'Sharvil Vichare'
WHERE LOWER(email) = 'sharvilvichare2704@gmail.com';
