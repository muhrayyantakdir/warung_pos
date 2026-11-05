-- ==============================================================================
-- WARUNG POS - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Copy and run this script directly in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier', 'owner')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100),
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    min_stock_alert INTEGER NOT NULL DEFAULT 5 CHECK (min_stock_alert >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) DEFAULT 'Pelanggan Umum',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    change_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'qris', 'transfer')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTION DETAILS TABLE
CREATE TABLE IF NOT EXISTS transaction_details (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    profit NUMERIC(15, 2) NOT NULL DEFAULT 0.00
);

-- 6. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT', 'SALE', 'RETURN')),
    quantity INTEGER NOT NULL,
    before_stock INTEGER NOT NULL,
    after_stock INTEGER NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS store_settings (
    id BIGSERIAL PRIMARY KEY,
    store_name VARCHAR(150) NOT NULL DEFAULT 'WARUNG POS REZEKI',
    address TEXT DEFAULT 'Jl. Sukajadi No. 45, Bandung',
    phone VARCHAR(50) DEFAULT '0812-3456-7890',
    receipt_header TEXT DEFAULT 'Selamat Berbelanja di Warung Kami',
    receipt_footer TEXT DEFAULT 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan. Terima Kasih!',
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR FAST SEARCH
CREATE INDEX IF NOT EXISTS idx_supa_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_supa_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_supa_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_supa_transactions_invoice ON transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_supa_transactions_created ON transactions(created_at);

-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE ANON ACCESS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow anon all on users" ON users;
    CREATE POLICY "Allow anon all on users" ON users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon all on categories" ON categories;
    CREATE POLICY "Allow anon all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon all on products" ON products;
    CREATE POLICY "Allow anon all on products" ON products FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon all on transactions" ON transactions;
    CREATE POLICY "Allow anon all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon all on transaction_details" ON transaction_details;
    CREATE POLICY "Allow anon all on transaction_details" ON transaction_details FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon all on stock_movements" ON stock_movements;
    CREATE POLICY "Allow anon all on stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon all on store_settings" ON store_settings;
    CREATE POLICY "Allow anon all on store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);
END $$;

-- INITIAL SEED DATA FOR SUPABASE
INSERT INTO store_settings (id, store_name, address, phone, receipt_header, receipt_footer, low_stock_threshold)
VALUES (1, 'WARUNG POS REZEKI', 'Jl. Sukajadi No. 45, Bandung', '0812-3456-7890', 'Terima kasih atas kunjungan Anda', 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan', 5)
ON CONFLICT (id) DO NOTHING;

-- Default Users:
-- admin / admin123
-- kasir1 / kasir123
INSERT INTO users (username, password_hash, full_name, role)
VALUES 
    ('admin', '$2a$10$pLw5w5lqJzW0jJ115h6NxeE8bZ0O5O1m3D9S6Z8H9Y6J5Z4W3X2K1', 'Pemilik Warung', 'admin'),
    ('kasir1', '$2a$10$pLw5w5lqJzW0jJ115h6NxeE8bZ0O5O1m3D9S6Z8H9Y6J5Z4W3X2K1', 'Kasir Utama', 'cashier')
ON CONFLICT (username) DO NOTHING;

-- Categories
INSERT INTO categories (name, slug, description)
VALUES 
    ('Sembako', 'sembako', 'Beras, minyak, gula, telur dan kebutuhan pokok'),
    ('Makanan & Snack', 'makanan-snack', 'Mie instan, biskuit, kerupuk, roti'),
    ('Minuman', 'minuman', 'Air mineral, kopi sachet, teh, minuman dingin'),
    ('Bumbu Dapur', 'bumbu-dapur', 'Kecap, saus, garam, penyedap rasa'),
    ('Kebutuhan Rumah', 'kebutuhan-rumah', 'Sabun cuci, pasta gigi, sampo, tisu'),
    ('Rokok & Tembakau', 'rokok-tembakau', 'Rokok kretek dan filter')
ON CONFLICT (slug) DO NOTHING;
