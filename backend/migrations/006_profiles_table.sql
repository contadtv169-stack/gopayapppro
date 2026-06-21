-- Run this in Supabase SQL Editor
-- Migration 006: Profiles table for public access + trigger

-- Step 1: Create profiles table with all needed columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  document VARCHAR(20),
  business_name VARCHAR(255),
  avatar_url TEXT,
  pix_key VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_id column if table existed but missing it
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Enable RLS (safe to run even if already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Policies (use DO block to avoid error if table or policy missing)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
    BEGIN
      DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
      CREATE POLICY "public_read_profiles" ON profiles FOR SELECT USING (true);
    EXCEPTION WHEN OTHERS THEN RAISE WARNING 'public_read_profiles policy error: %', SQLERRM; END;

    BEGIN
      DROP POLICY IF EXISTS "owner_insert_profiles" ON profiles;
      CREATE POLICY "owner_insert_profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN OTHERS THEN RAISE WARNING 'owner_insert_profiles policy error: %', SQLERRM; END;

    BEGIN
      DROP POLICY IF EXISTS "owner_update_profiles" ON profiles;
      CREATE POLICY "owner_update_profiles" ON profiles FOR UPDATE USING (auth.uid() = user_id);
    EXCEPTION WHEN OTHERS THEN RAISE WARNING 'owner_update_profiles policy error: %', SQLERRM; END;
  END IF;
END $$;

-- Step 4: Trigger to auto-create profile on signup (safe to run even if auth.users not accessible)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 5: Index
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
