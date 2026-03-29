-- DealDrop Schema & Realistic Seed Script (Chennai, Pondy, Salem, Bangalore)
-- Paste this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

-- 0. CLEANUP (Optional: If you want a fresh start, uncomment these)
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS deals CASCADE;
-- DROP TABLE IF EXISTS stores CASCADE;

-- 1. STORES
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  address TEXT DEFAULT '',
  city TEXT DEFAULT 'Chennai',
  latitude FLOAT8 DEFAULT 13.0827,
  longitude FLOAT8 DEFAULT 80.2707,
  phone TEXT DEFAULT '',
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  telegram_chat_id BIGINT,
  trust_score INT DEFAULT 100,
  trial_starts_at TIMESTAMPTZ DEFAULT now(),
  subscription_status TEXT DEFAULT 'trial'
);

-- 2. DEALS
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
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
  latitude FLOAT8,
  longitude FLOAT8,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  drop_points INT DEFAULT 0
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

-- 5. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  reviewer_type TEXT CHECK (reviewer_type IN ('buyer', 'dealer')),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SEED REAL-TIME STORE DATA (REAL CHENNAI & REGIONAL RETAILERS)
WITH store_data AS (
    INSERT INTO stores (name, category, address, city, latitude, longitude, verified) VALUES
    -- T. NAGAR (Shopping District)
    ('Saravana Stores (The Legend)', 'Fashion', '82, North Usman Road, T. Nagar', 'Chennai', 13.0394, 80.2325, true),
    ('Pothys Swarna Mahal', 'Fashion', '15, Nageswaran Rao Road, T. Nagar', 'Chennai', 13.0404, 80.2331, true),
    ('Adyar Ananda Bhavan (A2B)', 'Bakery', '94, North Usman Road, T. Nagar', 'Chennai', 13.0364, 80.2305, true),
    ('G Surya Narayana Grocery', 'Grocery', 'Dheenadhayalu Street, T. Nagar', 'Chennai', 13.0380, 80.2310, true),
    ('Shri Bhalaji Medicals', 'Pharmacy', 'North Usman Road, T. Nagar', 'Chennai', 13.0415, 80.2335, true),

    -- VELACHERY (Residential & Malls)
    ('Phoenix Marketcity (Zudio)', 'Fashion', '142, Velachery Main Road', 'Chennai', 12.9915, 80.2170, true),
    ('S Natesan Super Market', 'Grocery', 'Velachery Main Road, Velacheri', 'Chennai', 12.9791, 80.2245, true),
    ('Lingam Super Market', 'Grocery', 'Dhandeeswaram Main Road, Velacheri', 'Chennai', 12.9695, 80.2215, true),
    ('Theobroma Patisserie', 'Bakery', 'Phoenix Marketcity, Velachery', 'Chennai', 12.9920, 80.2175, true),
    ('Apollo Pharmacy Velachery', 'Pharmacy', 'Vijayanagar Main Road, Velacheri', 'Chennai', 12.9820, 80.2250, true),

    -- ANNA NAGAR (Upscale)
    ('Santhosh Super Stores', 'Grocery', '7th Main Road, Anna Nagar', 'Chennai', 13.0870, 80.2165, true),
    ('CK''s Bakery Anna Nagar', 'Bakery', '2nd Avenue, Anna Nagar East', 'Chennai', 13.0855, 80.2130, true),
    ('Max Fashion Anna Nagar', 'Fashion', '18th Main Road, Anna Nagar', 'Chennai', 13.0850, 80.2140, true),
    ('Nilgiris Supermarket', 'Grocery', 'SBOA School Road, Anna Nagar West', 'Chennai', 13.0895, 80.2085, true),
    ('Murugan Stores Supermarket', 'Grocery', 'Shanthi Colony, Anna Nagar', 'Chennai', 13.0835, 80.2145, true),

    -- TAMBARAM / VANDALUR
    ('Saravana Stores Tambaram', 'Fashion', 'Shanmugam Road, West Tambaram', 'Chennai', 12.9245, 80.1150, true),
    ('Balaji Super Store', 'Grocery', 'GST Road, West Tambaram', 'Chennai', 12.9225, 80.1180, true),
    ('Sri Krishna Sweets', 'Bakery', 'Venkatesan Street, West Tambaram', 'Chennai', 12.9265, 80.1170, true),
    ('MedPlus Tambaram', 'Pharmacy', 'Mudichur Road, Tambaram West', 'Chennai', 12.9240, 80.1155, true),
    ('Vandalur Fashion Hub', 'Fashion', 'GST Road, Vandalur', 'Chennai', 12.8915, 80.0810, true),

    -- OMR / NAVALUR
    ('Vivira Mall (Lifestyle)', 'Fashion', 'OMR Road, Navalur', 'Chennai', 12.8365, 80.2260, true),
    ('Spar Hypermarket', 'Grocery', 'The Marina Mall, OMR Egattur', 'Chennai', 12.8105, 80.2310, true),
    ('Fresh In Bazaar', 'Grocery', 'Sardhar Patel Road, Navalur', 'Chennai', 12.8480, 80.2265, true),
    ('Anbu Medicals Navalur', 'Pharmacy', 'OMR Service Road, Navalur', 'Chennai', 12.8350, 80.2245, true),

    -- PONDICHERRY
    ('Sri Vijaya Ganapathy Stores', 'Grocery', 'Eswaran Koil Street, Pondy Bazaar', 'Puducherry', 11.9340, 79.8310, true),
    ('Jaya Emporium', 'Fashion', 'Jawaharlal Nehru Street, Pondicherry', 'Puducherry', 11.9355, 79.8300, true),
    ('Nilgiris Pondy', 'Grocery', 'Rangapillai Street, Pondicherry', 'Puducherry', 11.9360, 79.8295, true),

    -- SALEM
    ('D Mart Salem', 'Grocery', 'Omalur Main Road, Five Road', 'Salem', 11.6825, 78.1255, true),
    ('Sellers Hyper Market', 'Grocery', 'Five Road, Salem', 'Salem', 11.6815, 78.1240, true),
    ('Barathi Shopping Sansar', 'Fashion', 'Cherry Road, Hastampatti', 'Salem', 11.6710, 78.1560, true),

    -- BANGALORE (INDIRANAGAR)
    ('Natures Basket', 'Grocery', '1st Stage, Indiranagar', 'Bangalore', 12.9785, 77.6390, true),
    ('Decathlon Indiranagar', 'Fashion', '80 Feet Road, Indiranagar', 'Bangalore', 12.9750, 77.6440, true),
    ('Mk Retail Supermarket', 'Grocery', 'CMH Road, Indiranagar', 'Bangalore', 12.9795, 77.6375, true)
    RETURNING id, name, category, latitude, longitude
)
-- 7. INSERT REALISTIC MOCKED PRODUCTS FOR EACH STORE
INSERT INTO deals (store_id, store_name, product_name, description, category, discount_pct, original_price, sale_price, expires_at, latitude, longitude, live_viewers)
SELECT 
    id, name,
    CASE 
        WHEN category = 'Bakery' THEN (ARRAY['Ghee Mysore Pak Box', 'Chocolate Truffle Cake', 'Paneer Puff (Set of 6)', 'Fresh Whole Wheat Bread'])[floor(random() * 4 + 1)::int]
        WHEN category = 'Grocery' THEN (ARRAY['Alphonso Mangoes (1kg)', 'Aashirvaad Atta (5kg)', 'Saffola Oil (1L)', 'Fresh Country Eggs (Dozen)'])[floor(random() * 4 + 1)::int]
        WHEN category = 'Fashion' THEN (ARRAY['Pure Silk Saree', 'Mens Formal Cotton Shirt', 'Zudio Casual Denim', 'Kids Ethnic Wear'])[floor(random() * 4 + 1)::int]
        WHEN category = 'Pharmacy' THEN (ARRAY['Vitamin C + Zinc Tablets', 'Digital Thermometer', 'N95 Mask Pack (10pcs)', 'Protinex Nutrition Powder'])[floor(random() * 4 + 1)::int]
        ELSE 'Store Special Deal'
    END,
    'Flash clearance! Verified near-expiry or end-of-season stock. Grab before price reverts!',
    category,
    floor(random() * 31 + 30)::int, -- 30% to 60%
    0, 0, -- To be updated below
    now() + (random() * 90 + 30) * interval '1 minute',
    latitude, longitude,
    floor(random() * 50)
FROM store_data;

-- 8. FINALIZE PRICING LOGIC
UPDATE deals SET original_price = 
    CASE 
        WHEN category = 'Bakery' THEN 250
        WHEN category = 'Grocery' THEN 450
        WHEN category = 'Fashion' THEN 1200
        WHEN category = 'Pharmacy' THEN 350
        ELSE 500
    END
WHERE id IS NOT NULL;

UPDATE deals SET sale_price = ROUND((original_price * (1 - (discount_pct::float / 100)))::numeric, 2)
WHERE id IS NOT NULL;
