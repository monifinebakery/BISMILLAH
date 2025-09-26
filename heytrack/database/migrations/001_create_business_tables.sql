-- =============================================
-- BISMILLAH Business Management Database Schema
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. SUPPLIERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('raw_materials', 'specialty_ingredients', 'packaging', 'equipment', 'dairy')),
    rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_orders INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0.00,
    last_order DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    payment_terms VARCHAR(50) DEFAULT '30 days',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for better performance
    CONSTRAINT suppliers_name_unique UNIQUE (name),
    CONSTRAINT suppliers_email_unique UNIQUE (email)
);

-- Create indexes on suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(rating);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at);

-- =============================================
-- 2. CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('business', 'individual')),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0.00,
    last_order DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    loyalty_points INTEGER DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT customers_email_unique UNIQUE (email)
);

-- Create indexes on customers
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent);
CREATE INDEX IF NOT EXISTS idx_customers_join_date ON customers(join_date);

-- =============================================
-- 3. INVENTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('raw_materials', 'specialty_ingredients', 'packaging', 'equipment', 'dairy')),
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('kg', 'g', 'l', 'ml', 'pcs', 'unit', 'box', 'pack')),
    current_stock DECIMAL(10,2) DEFAULT 0.00,
    min_stock DECIMAL(10,2) DEFAULT 0.00,
    max_stock DECIMAL(10,2) DEFAULT 0.00,
    unit_price DECIMAL(12,2) DEFAULT 0.00,
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (current_stock * unit_price) STORED,
    supplier VARCHAR(255),
    location VARCHAR(255),
    expiry_date DATE,
    status VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN current_stock <= 0 THEN 'out_of_stock'
            WHEN current_stock <= (min_stock * 0.5) THEN 'critical'
            WHEN current_stock <= min_stock THEN 'low'
            ELSE 'good'
        END
    ) STORED,
    last_updated DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_name_unique UNIQUE (name),
    CONSTRAINT inventory_positive_stock CHECK (current_stock >= 0),
    CONSTRAINT inventory_positive_price CHECK (unit_price >= 0)
);

-- Create indexes on inventory
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_current_stock ON inventory(current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(supplier);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);

-- =============================================
-- 4. ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'delivered', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'shipped', 'delivered')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT orders_positive_amount CHECK (total_amount >= 0)
);

-- Create indexes on orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders(due_date);

-- =============================================
-- 5. ORDER ITEMS TABLE (for detailed order items)
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL, -- Store name even if inventory item is deleted
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT order_items_positive_quantity CHECK (quantity > 0),
    CONSTRAINT order_items_positive_price CHECK (unit_price >= 0)
);

-- Create indexes on order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_inventory_id ON order_items(inventory_id);

-- =============================================
-- 6. PURCHASE ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    purchase_date DATE DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'shipped', 'received', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT purchase_orders_positive_amount CHECK (total_amount >= 0)
);

-- Create indexes on purchase_orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_purchase_date ON purchase_orders(purchase_date);

-- =============================================
-- 7. PURCHASE ORDER ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    received_quantity DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT purchase_order_items_positive_quantity CHECK (quantity > 0),
    CONSTRAINT purchase_order_items_positive_price CHECK (unit_price >= 0),
    CONSTRAINT purchase_order_items_valid_received CHECK (received_quantity >= 0 AND received_quantity <= quantity)
);

-- Create indexes on purchase_order_items
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_inventory_id ON purchase_order_items(inventory_id);

-- =============================================
-- 8. RECIPES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    serving_size INTEGER DEFAULT 1,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    cost_per_serving DECIMAL(10,2) DEFAULT 0.00,
    selling_price DECIMAL(10,2) DEFAULT 0.00,
    profit_margin DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN selling_price > 0 THEN ((selling_price - cost_per_serving) / selling_price * 100)
            ELSE 0
        END
    ) STORED,
    instructions TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT recipes_name_unique UNIQUE (name),
    CONSTRAINT recipes_positive_serving_size CHECK (serving_size > 0),
    CONSTRAINT recipes_positive_prices CHECK (cost_per_serving >= 0 AND selling_price >= 0)
);

-- Create indexes on recipes
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_is_active ON recipes(is_active);
CREATE INDEX IF NOT EXISTS idx_recipes_profit_margin ON recipes(profit_margin);

-- =============================================
-- 9. RECIPE INGREDIENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
    ingredient_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_per_unit DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * cost_per_unit) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT recipe_ingredients_positive_quantity CHECK (quantity > 0),
    CONSTRAINT recipe_ingredients_positive_cost CHECK (cost_per_unit >= 0)
);

-- Create indexes on recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_inventory_id ON recipe_ingredients(inventory_id);

-- =============================================
-- 10. FINANCIAL TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date DATE DEFAULT CURRENT_DATE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- 'order', 'purchase_order', 'manual', etc.
    reference_id UUID, -- ID of the related order/purchase/etc.
    payment_method VARCHAR(50),
    account VARCHAR(100),
    receipt_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT financial_transactions_non_zero_amount CHECK (amount != 0)
);

-- Create indexes on financial_transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON financial_transactions(reference_type, reference_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =============================================

-- Enable RLS on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (you can customize these based on your needs)
-- For now, allowing authenticated users to do everything

-- Suppliers policies
CREATE POLICY "Enable all operations for authenticated users on suppliers" ON suppliers FOR ALL TO authenticated USING (true);

-- Customers policies
CREATE POLICY "Enable all operations for authenticated users on customers" ON customers FOR ALL TO authenticated USING (true);

-- Inventory policies
CREATE POLICY "Enable all operations for authenticated users on inventory" ON inventory FOR ALL TO authenticated USING (true);

-- Orders policies
CREATE POLICY "Enable all operations for authenticated users on orders" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users on order_items" ON order_items FOR ALL TO authenticated USING (true);

-- Purchase orders policies
CREATE POLICY "Enable all operations for authenticated users on purchase_orders" ON purchase_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users on purchase_order_items" ON purchase_order_items FOR ALL TO authenticated USING (true);

-- Recipes policies
CREATE POLICY "Enable all operations for authenticated users on recipes" ON recipes FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users on recipe_ingredients" ON recipe_ingredients FOR ALL TO authenticated USING (true);

-- Financial transactions policies
CREATE POLICY "Enable all operations for authenticated users on financial_transactions" ON financial_transactions FOR ALL TO authenticated USING (true);

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address, category, rating, payment_terms, notes) VALUES
('CV Toko Bahan Kue', 'Pak Ahmad', '081234567890', 'ahmad@tokobahankue.com', 'Jl. Pasar Minggu No. 123, Jakarta Selatan', 'raw_materials', 4.8, '30 days', 'Supplier utama untuk tepung dan gula'),
('Supplier Coklat Jakarta', 'Ibu Sari', '081234567891', 'sari@coklatjakarta.com', 'Jl. Kemang Raya No. 456, Jakarta Selatan', 'specialty_ingredients', 4.5, '14 days', 'Kualitas coklat sangat baik'),
('Toko Kemasan Murah', 'Pak Budi', '081234567892', 'budi@kemasanmurah.com', 'Jl. Cibubur No. 789, Depok', 'packaging', 4.2, 'Cash', 'Harga kompetitif untuk kemasan'),
('Equipment Pro', 'Bu Dewi', '081234567893', 'dewi@equipmentpro.com', 'Jl. Industri No. 321, Tangerang', 'equipment', 4.9, 'COD', 'Peralatan berkualitas tinggi')
ON CONFLICT (name) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, type, loyalty_points, notes, rating) VALUES
('Sari Bakery', 'owner@saribakery.com', '081234567890', 'Jl. Kemang Raya No. 123, Jakarta Selatan', 'business', 2575, 'Pelanggan VIP, selalu order dalam jumlah besar', 4.9),
('Budi Hartono', 'budi.hartono@gmail.com', '081234567891', 'Jl. Merdeka No. 456, Bandung', 'individual', 320, 'Suka produk premium, pembayaran selalu tepat waktu', 4.7),
('Toko Roti Mawar', 'info@rotimawar.co.id', '081234567892', 'Jl. Diponegoro No. 789, Surabaya', 'business', 1895, 'Rutin order setiap minggu, sangat terpercaya', 4.8),
('Maya Sari', 'maya.sari@yahoo.com', '081234567893', 'Jl. Sudirman No. 321, Medan', 'individual', 150, 'Pelanggan seasonal, biasanya order saat ada event', 4.3)
ON CONFLICT (email) DO NOTHING;

-- Insert sample inventory items
INSERT INTO inventory (name, category, unit, current_stock, min_stock, max_stock, unit_price, supplier, location, notes) VALUES
('Tepung Terigu Premium', 'raw_materials', 'kg', 150, 50, 500, 12000, 'CV Toko Bahan Kue', 'Gudang A - Rak 1', 'Kualitas premium untuk roti dan kue'),
('Coklat Bubuk', 'specialty_ingredients', 'kg', 25, 30, 100, 85000, 'Supplier Coklat Jakarta', 'Gudang A - Rak 2', 'Perlu restock segera, stok hampir habis'),
('Kemasan Box Kue', 'packaging', 'pcs', 500, 100, 1000, 2500, 'Toko Kemasan Murah', 'Gudang B - Rak 1', 'Kemasan berkualitas untuk produk premium'),
('Mixer Stand KitchenAid', 'equipment', 'unit', 2, 1, 5, 4500000, 'Equipment Pro', 'Area Produksi', 'Peralatan utama untuk produksi cake'),
('Susu Bubuk Full Cream', 'dairy', 'kg', 10, 15, 80, 45000, 'Dairy Fresh Indonesia', 'Gudang A - Rak 3', 'Stok kritis! Segera lakukan pembelian')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE 'BISMILLAH Business Management Database Schema created successfully!';
    RAISE NOTICE 'Tables created: suppliers, customers, inventory, orders, order_items, purchase_orders, purchase_order_items, recipes, recipe_ingredients, financial_transactions';
    RAISE NOTICE 'Sample data inserted for testing purposes.';
    RAISE NOTICE 'Row Level Security (RLS) enabled with basic policies for authenticated users.';
END $$;