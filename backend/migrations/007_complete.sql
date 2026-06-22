-- GoPay Complete Migration - Run in Supabase SQL Editor
-- Cria todas as tabelas, colunas, RLS policies, triggers e funcoes

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================
-- TABELAS
-- ============================

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  product_type VARCHAR(20) DEFAULT 'digital',
  is_active BOOLEAN DEFAULT TRUE,
  checkout_url VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  payment_link_id UUID,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_document VARCHAR(20),
  amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(20),
  gateway VARCHAR(50) DEFAULT 'gopay',
  gateway_transaction_id VARCHAR(255),
  pix_code TEXT,
  pix_qr TEXT,
  pix_key TEXT,
  gateway_error TEXT,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Add missing columns (safe if already exist)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) DEFAULT 'gopay';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_transaction_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_qr TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_error TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_key TEXT;

-- Payment Links
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_payments INTEGER,
  current_payments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customizations
CREATE TABLE IF NOT EXISTS customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  logo_url TEXT,
  banner_type VARCHAR(20) DEFAULT 'none',
  banner_url TEXT,
  banner_color VARCHAR(7) DEFAULT '#22c55e',
  banner_gradient_start VARCHAR(7) DEFAULT '#22c55e',
  banner_gradient_end VARCHAR(7) DEFAULT '#6366f1',
  button_color VARCHAR(7) DEFAULT '#22c55e',
  button_text_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#111827',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  logo_position VARCHAR(10) DEFAULT 'center',
  gallery_images JSONB DEFAULT '[]'::jsonb,
  gallery_layout VARCHAR(20) DEFAULT 'grid',
  quiz_enabled BOOLEAN DEFAULT FALSE,
  quiz_title VARCHAR(255) DEFAULT 'Antes de continuar...',
  quiz_questions JSONB DEFAULT '[]'::jsonb,
  reviews_enabled BOOLEAN DEFAULT FALSE,
  reviews JSONB DEFAULT '[]'::jsonb,
  white_label BOOLEAN DEFAULT FALSE,
  affiliate_link TEXT DEFAULT '',
  redirect_url TEXT DEFAULT '',
  video_url TEXT,
  landing_sections JSONB DEFAULT '[]'::jsonb,
  custom_css TEXT,
  custom_js TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS affiliate_link TEXT DEFAULT '';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS redirect_url TEXT DEFAULT '';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS banner_color VARCHAR(7) DEFAULT '#22c55e';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS banner_gradient_start VARCHAR(7) DEFAULT '#22c55e';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS banner_gradient_end VARCHAR(7) DEFAULT '#6366f1';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS button_color VARCHAR(7) DEFAULT '#22c55e';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#111827';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS logo_position VARCHAR(10) DEFAULT 'center';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS gallery_layout VARCHAR(20) DEFAULT 'grid';
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS quiz_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS reviews_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS white_label BOOLEAN DEFAULT FALSE;

-- Notifications
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  order_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  document VARCHAR(20),
  business_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp config
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  instance_id VARCHAR(255),
  api_token TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Gateway credentials (kept for compatibility, not used in UI)
CREATE TABLE IF NOT EXISTS gateway_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  gateway VARCHAR(50) NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  encrypted_secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gateway)
);

-- ============================
-- INDEXES
-- ============================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_pix_code ON orders(pix_code);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_slug ON payment_links(slug);

-- ============================
-- RLS POLICIES
-- ============================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateway_credentials ENABLE ROW LEVEL SECURITY;

-- Products: public read, owner write
DROP POLICY IF EXISTS "public_select_products" ON products;
DROP POLICY IF EXISTS "owner_insert_products" ON products;
DROP POLICY IF EXISTS "owner_update_products" ON products;
DROP POLICY IF EXISTS "owner_delete_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT USING (true);
CREATE POLICY "owner_insert_products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner_delete_products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Orders: public insert, owner select
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
DROP POLICY IF EXISTS "owner_select_orders" ON orders;
DROP POLICY IF EXISTS "owner_update_orders" ON orders;
CREATE POLICY "public_insert_orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "owner_select_orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_update_orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

-- Payment links: owner all
DROP POLICY IF EXISTS "owner_all_payment_links" ON payment_links;
CREATE POLICY "owner_all_payment_links" ON payment_links FOR ALL USING (auth.uid() = user_id);

-- Customizations: public read, owner write
DROP POLICY IF EXISTS "public_select_customizations" ON customizations;
DROP POLICY IF EXISTS "owner_insert_customizations" ON customizations;
DROP POLICY IF EXISTS "owner_update_customizations" ON customizations;
CREATE POLICY "public_select_customizations" ON customizations FOR SELECT USING (true);
CREATE POLICY "owner_insert_customizations" ON customizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_customizations" ON customizations FOR UPDATE USING (auth.uid() = user_id);

-- Notifications: owner select/update
DROP POLICY IF EXISTS "owner_select_notifications" ON notifications;
DROP POLICY IF EXISTS "owner_update_notifications" ON notifications;
CREATE POLICY "owner_select_notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_update_notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Profiles: public read, owner insert/update
DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
DROP POLICY IF EXISTS "owner_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "owner_update_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "owner_insert_profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_profiles" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- WhatsApp: owner all
DROP POLICY IF EXISTS "owner_all_whatsapp" ON whatsapp_config;
CREATE POLICY "owner_all_whatsapp" ON whatsapp_config FOR ALL USING (auth.uid() = user_id);

-- Gateway creds: owner all
DROP POLICY IF EXISTS "owner_all_gateways" ON gateway_credentials;
CREATE POLICY "owner_all_gateways" ON gateway_credentials FOR ALL USING (auth.uid() = user_id);

-- ============================
-- TRIGGERS & FUNCTIONS
-- ============================

-- Notification trigger for new orders
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data, order_id, is_read)
  VALUES (
    NEW.user_id,
    'payment',
    'Nova venda recebida!',
    'Pedido de ' || COALESCE(NEW.customer_name, 'cliente') || ' - R$ ' || NEW.amount::TEXT,
    jsonb_build_object('order_id', NEW.id, 'amount', NEW.amount, 'customer', NEW.customer_name, 'product', NEW.product_id),
    NEW.id,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_order_notify ON orders;
CREATE TRIGGER on_new_order_notify
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- Auto-create profile on user signup
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

-- Gateway upsert function
CREATE OR REPLACE FUNCTION upsert_gateway_credential(
  p_user_id UUID,
  p_gateway VARCHAR,
  p_encrypted_api_key TEXT,
  p_encrypted_secret TEXT DEFAULT NULL
) RETURNS SETOF gateway_credentials
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY INSERT INTO gateway_credentials (user_id, gateway, encrypted_api_key, encrypted_secret)
  VALUES (p_user_id, p_gateway, p_encrypted_api_key, p_encrypted_secret)
  ON CONFLICT (user_id, gateway)
  DO UPDATE SET encrypted_api_key = EXCLUDED.encrypted_api_key, encrypted_secret = EXCLUDED.encrypted_secret, updated_at = NOW()
  RETURNING *;
END;
$$;
