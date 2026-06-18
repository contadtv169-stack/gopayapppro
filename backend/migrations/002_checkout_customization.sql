-- GoPay Checkout Customization (White-Label Editor)
-- Run this in Supabase SQL Editor after migration 001

CREATE TABLE checkout_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- White Label
  white_label BOOLEAN DEFAULT FALSE,
  hide_gopay_branding BOOLEAN DEFAULT FALSE,
  
  -- Logo
  logo_url TEXT,
  logo_position VARCHAR(20) DEFAULT 'center' CHECK (logo_position IN ('left', 'center', 'right')),
  
  -- Banner
  banner_url TEXT,
  banner_type VARCHAR(20) DEFAULT 'image' CHECK (banner_type IN ('image', 'color', 'gradient')),
  banner_color VARCHAR(20),
  banner_gradient_start VARCHAR(20),
  banner_gradient_end VARCHAR(20),
  
  -- Video
  video_url TEXT,
  video_autoplay BOOLEAN DEFAULT FALSE,
  video_loop BOOLEAN DEFAULT FALSE,
  
  -- Quiz
  quiz_enabled BOOLEAN DEFAULT FALSE,
  quiz_title VARCHAR(255),
  quiz_questions JSONB DEFAULT '[]'::jsonb,
  
  -- Gallery
  gallery_images JSONB DEFAULT '[]'::jsonb,
  gallery_layout VARCHAR(20) DEFAULT 'grid' CHECK (gallery_layout IN ('grid', 'carousel', 'list')),
  
  -- Reviews/Avaliações
  reviews_enabled BOOLEAN DEFAULT FALSE,
  reviews JSONB DEFAULT '[]'::jsonb,
  reviews_average DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  
  -- Colors
  primary_color VARCHAR(20) DEFAULT '#22c55e',
  secondary_color VARCHAR(20) DEFAULT '#6366f1',
  background_color VARCHAR(20) DEFAULT '#ffffff',
  text_color VARCHAR(20) DEFAULT '#111827',
  button_color VARCHAR(20) DEFAULT '#22c55e',
  button_text_color VARCHAR(20) DEFAULT '#ffffff',

  -- Custom CSS/JS
  custom_css TEXT,
  custom_js TEXT,
  
  -- Active theme
  theme VARCHAR(20) DEFAULT 'default' CHECK (theme IN ('default', 'dark', 'minimal', 'custom')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

-- Page customization (for payment links / general page)
CREATE TABLE page_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_type VARCHAR(20) NOT NULL CHECK (page_type IN ('checkout', 'payment_link', 'all')),
  page_id UUID, -- nullable, if specific to a product or link
  
  -- Same structure as checkout_customizations
  white_label BOOLEAN DEFAULT FALSE,
  hide_gopay_branding BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  logo_position VARCHAR(20) DEFAULT 'center',
  banner_url TEXT,
  banner_type VARCHAR(20) DEFAULT 'image',
  banner_color VARCHAR(20),
  banner_gradient_start VARCHAR(20),
  banner_gradient_end VARCHAR(20),
  video_url TEXT,
  video_autoplay BOOLEAN DEFAULT FALSE,
  video_loop BOOLEAN DEFAULT FALSE,
  quiz_enabled BOOLEAN DEFAULT FALSE,
  quiz_title VARCHAR(255),
  quiz_questions JSONB DEFAULT '[]'::jsonb,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  gallery_layout VARCHAR(20) DEFAULT 'grid',
  reviews_enabled BOOLEAN DEFAULT FALSE,
  reviews JSONB DEFAULT '[]'::jsonb,
  reviews_average DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  primary_color VARCHAR(20) DEFAULT '#22c55e',
  secondary_color VARCHAR(20) DEFAULT '#6366f1',
  background_color VARCHAR(20) DEFAULT '#ffffff',
  text_color VARCHAR(20) DEFAULT '#111827',
  button_color VARCHAR(20) DEFAULT '#22c55e',
  button_text_color VARCHAR(20) DEFAULT '#ffffff',
  custom_css TEXT,
  custom_js TEXT,
  theme VARCHAR(20) DEFAULT 'default',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, page_type, page_id)
);

-- Indexes
CREATE INDEX idx_checkout_customizations_user ON checkout_customizations(user_id);
CREATE INDEX idx_checkout_customizations_product ON checkout_customizations(product_id);
CREATE INDEX idx_page_customizations_user ON page_customizations(user_id);
