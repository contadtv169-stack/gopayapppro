-- Run this in Supabase SQL Editor
-- Fix gateway credentials: RLS policies + SECURITY DEFINER function

-- 1. Add UPDATE and DELETE policies (required for upsert)
DROP POLICY IF EXISTS "users_update_own_gateways" ON gateway_credentials;
DROP POLICY IF EXISTS "users_delete_own_gateways" ON gateway_credentials;
CREATE POLICY "users_update_own_gateways" ON gateway_credentials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_gateways" ON gateway_credentials FOR DELETE USING (auth.uid() = user_id);

-- 2. Create/update the bypass function
CREATE OR REPLACE FUNCTION upsert_gateway_credential(
  p_user_id UUID,
  p_gateway VARCHAR,
  p_encrypted_api_key TEXT,
  p_encrypted_secret TEXT
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO gateway_credentials (user_id, gateway, encrypted_api_key, encrypted_secret, is_active)
  VALUES (p_user_id, p_gateway, p_encrypted_api_key, p_encrypted_secret, true)
  ON CONFLICT (user_id, gateway) 
  DO UPDATE SET encrypted_api_key = p_encrypted_api_key, encrypted_secret = p_encrypted_secret, is_active = true, updated_at = NOW();
END;
$$;

-- 3. Add missing columns to customizations if not exist
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS affiliate_link TEXT DEFAULT '';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS landing_sections JSONB DEFAULT '[]';

-- 4. Add missing columns to orders if not exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) DEFAULT 'gopay';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_qr TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_error TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. Public policies for checkout access
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_select_customizations" ON customizations;
CREATE POLICY "public_select_customizations" ON customizations FOR SELECT USING (true);
