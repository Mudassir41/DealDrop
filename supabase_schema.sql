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

-- 5. SEED DATA — Vandalur / Chennai area
INSERT INTO deals (
  store_name, product_name, description, category,
  discount_pct, original_price, sale_price,
  units_available, units_claimed,
  geofence_radius, expires_at, latitude, longitude, live_viewers
) VALUES
  ('Sri Murugan Bakery', 'Fresh Wheat Bread Loaves', 'Freshly baked wheat bread, 400g. Made this morning — must sell today.', 'food',
   50, 60, 30, 25, 5, 1000, now() + interval '2 hours', 12.9010, 80.0990, 14),
  ('Vandalur Fashion Hub', 'Cotton Salwar Suits — Clearance', 'End of season cotton salwar suits, all sizes. Premium quality.', 'fashion',
   60, 900, 360, 30, 6, 2000, now() + interval '4 hours', 12.9045, 80.1020, 9),
  ('Chennai Fresh Mart', 'Organic Tomatoes — 1kg', 'Farm-fresh tomatoes from Hosur. Near expiry — heavy discount.', 'grocery',
   40, 80, 48, 20, 4, 1500, now() + interval '90 minutes', 12.8975, 80.0965, 21),
  ('MedPlus Vandalur', 'Vitamin C + Zinc Tablets', '60 tablets, approaching best-before. Same quality, big discount.', 'pharmacy',
   35, 350, 227, 18, 2, 1000, now() + interval '3 hours', 12.9030, 80.1010, 6),
  ('Zudio Vandalur', 'Kids T-Shirts Pack of 3', 'Cotton t-shirts for kids age 4-12. Only 12 packs left.', 'fashion',
   45, 599, 329, 12, 1, 1500, now() + interval '5 hours', 12.8990, 80.0950, 11),
  ('Anna Supermarket', 'Alphonso Mangoes — 500g', 'Tree-ripened Alphonso mangoes. Last batch this season.', 'grocery',
   30, 200, 140, 30, 10, 2000, now() + interval '3 hours', 12.9060, 80.1035, 17);


-- 6. AUTO-EXPIRE (optional — run as a cron or just call periodically)
-- UPDATE deals SET status = 'sold_out' WHERE status = 'active' AND units_claimed >= units_available;
-- UPDATE deals SET status = 'expired' WHERE status = 'active' AND expires_at < now();

-- 7. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  reviewer_type TEXT CHECK (reviewer_type IN ('buyer', 'dealer')),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);
