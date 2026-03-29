-- DealDrop Schema
-- Paste this in Supabase: Dashboard → SQL Editor → New query → paste → Run

-- 1. STORES
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  address TEXT DEFAULT '',
  city TEXT DEFAULT 'Bangalore',
  latitude FLOAT8 DEFAULT 12.9716,
  longitude FLOAT8 DEFAULT 77.5946,
  phone TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DEALS
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  store_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  discount_pct INT NOT NULL DEFAULT 0,
  original_price FLOAT8,
  sale_price FLOAT8,
  units_available INT NOT NULL DEFAULT 10,
  units_claimed INT NOT NULL DEFAULT 0,
  geofence_radius INT DEFAULT 2000,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','paused','sold_out')),
  channels JSONB DEFAULT '{"telegram": true}',
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  latitude FLOAT8 DEFAULT 12.9716,
  longitude FLOAT8 DEFAULT 77.5946,
  live_viewers INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CUSTOMERS (Telegram subscribers + web users)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT UNIQUE,
  persona TEXT DEFAULT 'hunter',
  category_prefs TEXT[] DEFAULT '{}',
  latitude FLOAT8,
  longitude FLOAT8,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'deal_alert',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SEED DATA (4 demo deals for immediate demo-ability)
INSERT INTO deals (
  store_name, product_name, description, category,
  discount_pct, original_price, sale_price,
  units_available, units_claimed,
  geofence_radius, expires_at, latitude, longitude, live_viewers
) VALUES
  ('Mehta Bakery', 'Fresh Whole Wheat Bread', 'Freshly baked whole wheat bread, 400g loaves. Made this morning.', 'food',
   50, 60, 30, 25, 5, 1000, now() + interval '2 hours', 12.9716, 77.5946, 12),
  ('StyleHub Fashion', 'Cotton Kurtas — End of Season', 'Premium cotton kurtas, all sizes. Clearing end-of-season stock.', 'fashion',
   60, 1200, 480, 40, 8, 2000, now() + interval '4 hours', 12.9750, 77.5980, 8),
  ('FreshMart Groceries', 'Organic Mangoes — 1kg Pack', 'Alphonso mangoes, tree-ripened. Near expiry — must sell today.', 'grocery',
   40, 350, 210, 15, 3, 1500, now() + interval '90 minutes', 12.9680, 77.5910, 18),
  ('PharmaCare Plus', 'Vitamin D3 Supplements', '60 tablets pack, approaching best-before date. Same quality.', 'pharmacy',
   35, 450, 292, 20, 2, 1000, now() + interval '3 hours', 12.9730, 77.6010, 5);

-- 6. AUTO-EXPIRE (optional — run as a cron or just call periodically)
-- UPDATE deals SET status = 'sold_out' WHERE status = 'active' AND units_claimed >= units_available;
-- UPDATE deals SET status = 'expired' WHERE status = 'active' AND expires_at < now();
