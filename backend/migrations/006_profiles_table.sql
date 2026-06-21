-- Run this in Supabase SQL Editor
-- Migration 006: Profiles table for public access + cleanup

-- Create profiles table (one row per auth user, publicly readable)
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read for anyone (needed for checkout page)
DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT USING (true);

-- Owner can insert/update their own profile
DROP POLICY IF EXISTS "owner_insert_profiles" ON profiles;
CREATE POLICY "owner_insert_profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update_profiles" ON profiles;
CREATE POLICY "owner_update_profiles" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on user signup (trigger)
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

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Remove old gateway tables that are no longer used
-- COMMENTED OUT - keep gateway_credentials table for data preservation
-- DROP TABLE IF EXISTS gateway_credentials CASCADE;
