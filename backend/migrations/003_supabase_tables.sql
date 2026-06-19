-- Run this in Supabase SQL Editor
-- Habilita UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  payment_link_id UUID REFERENCES payment_links(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_document VARCHAR(20),
  amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(20),
  gateway VARCHAR(50),
  gateway_transaction_id VARCHAR(255),
  pix_code TEXT,
  pix_qr TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Tabela de links de pagamento
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Tabela de notificacoes
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de gateway credentials
CREATE TABLE IF NOT EXISTS gateway_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway VARCHAR(50) NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  encrypted_secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gateway)
);

-- Tabela de configuracao WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id VARCHAR(255),
  api_token TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  auto_reply BOOLEAN DEFAULT TRUE,
  welcome_message TEXT DEFAULT 'Ola! Bem-vindo a {loja}!',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela de customizacoes checkout
CREATE TABLE IF NOT EXISTS customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  banner_url TEXT DEFAULT '',
  banner_type VARCHAR(20) DEFAULT 'image',
  logo_url TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  video_autoplay BOOLEAN DEFAULT FALSE,
  video_loop BOOLEAN DEFAULT FALSE,
  quiz_title TEXT DEFAULT '',
  quiz_questions JSONB DEFAULT '[]',
  gallery_images JSONB DEFAULT '[]',
  reviews JSONB DEFAULT '[]',
  primary_color VARCHAR(7) DEFAULT '#10b981',
  secondary_color VARCHAR(7) DEFAULT '#059669',
  custom_css TEXT DEFAULT '',
  custom_js TEXT DEFAULT '',
  demo_mode BOOLEAN DEFAULT TRUE,
  theme VARCHAR(20) DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Tabela de transacoes
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway VARCHAR(50) NOT NULL,
  gateway_transaction_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2),
  status VARCHAR(20) NOT NULL,
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateway_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Products: usuarios so veem seus proprios produtos
CREATE POLICY "users_select_own_products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Orders: usuarios so veem seus proprios pedidos
CREATE POLICY "users_select_own_orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment links
CREATE POLICY "users_select_own_links" ON payment_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_links" ON payment_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_links" ON payment_links FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "users_select_own_notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Gateway credentials
CREATE POLICY "users_select_own_gateways" ON gateway_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_gateways" ON gateway_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WhatsApp config
CREATE POLICY "users_select_own_whatsapp" ON whatsapp_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_whatsapp" ON whatsapp_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_whatsapp" ON whatsapp_config FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_payment_links_slug ON payment_links(slug);
