-- Run this in Supabase SQL Editor
-- Migration 004: Add missing columns to all tables

-- Orders missing columns
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

-- Customizations missing columns
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

-- Notifications: add order_id reference
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;

-- Add notification trigger for new orders
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_new_order_notify ON orders;
CREATE TRIGGER on_new_order_notify
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();

-- RLS policies for orders insert (allow public checkout to insert)
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_select_customizations" ON customizations;
CREATE POLICY "public_select_customizations" ON customizations FOR SELECT USING (true);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_pix_code ON orders(pix_code);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
