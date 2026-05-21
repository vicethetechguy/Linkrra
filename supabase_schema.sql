-- LINKRRA COMPLETE SUPABASE DATABASE SCHEMA DDL
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/vynxuwyuewfnzkbpuwye/sql/new)

-- Disable RLS (Row Level Security) by default or enable and grant access.
-- Since the Node.js server connects using the administrative Service Role Key, 
-- RLS policies will be bypassed on the server-side, mirroring traditional direct DB connections.

-- Drop existing tables if they exist to start fresh (Optional, use with caution)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS social_posts CASCADE;
DROP TABLE IF EXISTS loyalty_customers CASCADE;
DROP TABLE IF EXISTS loyalty_settings CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS shop_items CASCADE;
DROP TABLE IF EXISTS design_settings CASCADE;
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    business_name TEXT NOT NULL DEFAULT '',
    plan TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUSINESSES TABLE
CREATE TABLE businesses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. PROFILES TABLE
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    banner_url TEXT DEFAULT '',
    layout_type TEXT DEFAULT 'classic',
    title_style TEXT DEFAULT 'text'
);

-- 4. LINKS TABLE
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'My Link',
    url TEXT NOT NULL DEFAULT '',
    icon TEXT DEFAULT 'link',
    type TEXT DEFAULT 'link',
    image_url TEXT DEFAULT '',
    position INTEGER DEFAULT 0,
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. DESIGN SETTINGS TABLE
CREATE TABLE design_settings (
    business_id INTEGER PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    wallpaper TEXT DEFAULT '',
    button_style TEXT DEFAULT 'filled',
    color_primary TEXT DEFAULT '#bc9eff',
    color_bg TEXT DEFAULT '#0b0f11',
    font TEXT DEFAULT 'Space Grotesk',
    settings_json JSONB DEFAULT '{}'::jsonb
);

-- 6. SHOP ITEMS TABLE
CREATE TABLE shop_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Product',
    price DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    image_url TEXT DEFAULT '',
    description TEXT DEFAULT '',
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. BLOG POSTS TABLE
CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    content TEXT DEFAULT '',
    excerpt TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    is_published SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. INVOICES TABLE
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_number TEXT DEFAULT '',
    invoice_date TEXT DEFAULT '',
    due_date TEXT DEFAULT '',
    business_data JSONB DEFAULT '{}'::jsonb,
    client_data JSONB DEFAULT '{}'::jsonb,
    items_data JSONB DEFAULT '[]'::jsonb,
    total DOUBLE PRECISION DEFAULT 0.0,
    notes TEXT DEFAULT '',
    template TEXT DEFAULT 'classic',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. ANALYTICS TABLE
CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'view', 'click'
    element_id TEXT, -- link id, product id, etc.
    device TEXT,
    country TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. LOYALTY SETTINGS TABLE
CREATE TABLE loyalty_settings (
    business_id INTEGER PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    is_enabled SMALLINT DEFAULT 0,
    points_per_naira DOUBLE PRECISION DEFAULT 0.01,
    min_redeem_points INTEGER DEFAULT 100,
    reward_description TEXT DEFAULT 'Get discounts on your next purchase!'
);

-- 11. LOYALTY CUSTOMERS TABLE
CREATE TABLE loyalty_customers (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    points_balance INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, customer_email)
);

-- 12. SOCIAL POSTS TABLE
CREATE TABLE social_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'twitter', 'instagram', etc.
    content TEXT NOT NULL,
    media_url TEXT,
    scheduled_for TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'posted', 'failed'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    is_read SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_links_business_id ON links(business_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_business_id ON shop_items(business_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_business_id ON blog_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_business_id ON analytics(business_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_business_id ON loyalty_customers(business_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_business_id ON social_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
