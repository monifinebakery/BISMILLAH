-- =====================================
-- PROFIT ANALYSIS COMPLETE SCHEMA
-- Comprehensive SQL for Supabase
-- =====================================

-- 1. FINANCIAL TRANSACTIONS TABLE
-- Untuk tracking revenue dan expenses
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text,
  amount numeric NOT NULL CHECK (amount >= 0),
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_date date, -- Alias untuk kompatibilitas
  notes text,
  related_id uuid, -- Untuk linking ke order/purchase
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. BAHAN BAKU TABLE (Materials/Ingredients)
-- Untuk COGS calculation dengan WAC support
CREATE TABLE IF NOT EXISTS public.bahan_baku (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama text NOT NULL,
  kategori text NOT NULL,
  stok numeric NOT NULL DEFAULT 0 CHECK (stok >= 0),
  satuan text NOT NULL,
  minimum numeric NOT NULL DEFAULT 0 CHECK (minimum >= 0),
  harga_satuan numeric NOT NULL DEFAULT 0 CHECK (harga_satuan >= 0),
  harga_rata_rata numeric CHECK (harga_rata_rata IS NULL OR harga_rata_rata >= 0), -- WAC price
  supplier text,
  tanggal_kadaluwarsa date,
  status text DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, nama)
);

-- 3. OPERATIONAL COSTS TABLE
-- Untuk operational expenses tracking
CREATE TABLE IF NOT EXISTS public.operational_costs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_biaya text NOT NULL,
  jumlah_per_bulan numeric NOT NULL CHECK (jumlah_per_bulan >= 0),
  jenis text NOT NULL CHECK (jenis IN ('tetap', 'variabel')),
  cost_category text,
  "group" text, -- Untuk grouping (hpp, operasional)
  status text DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. APP SETTINGS TABLE
-- Untuk global configuration dan cost allocation
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_produksi_per_bulan numeric DEFAULT 1000 CHECK (target_produksi_per_bulan > 0),
  overhead_per_pcs numeric DEFAULT 0 CHECK (overhead_per_pcs >= 0),
  operasional_per_pcs numeric DEFAULT 0 CHECK (operasional_per_pcs >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. PROFIT ANALYSIS TABLE
-- Untuk menyimpan hasil analisis profit
CREATE TABLE IF NOT EXISTS public.profit_analysis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL, -- Format: "YYYY-MM"
  period_type text NOT NULL CHECK (period_type IN ('daily', 'monthly', 'quarterly', 'yearly')),
  
  -- Revenue Data
  total_revenue numeric NOT NULL DEFAULT 0,
  revenue_breakdown jsonb DEFAULT '[]'::jsonb,
  
  -- Cost Data
  total_cogs numeric NOT NULL DEFAULT 0, -- Cost of Goods Sold
  cogs_breakdown jsonb DEFAULT '[]'::jsonb,
  total_opex numeric NOT NULL DEFAULT 0, -- Operational Expenses
  opex_breakdown jsonb DEFAULT '[]'::jsonb,
  
  -- Profit Calculations
  gross_profit numeric NOT NULL DEFAULT 0, -- Revenue - COGS
  net_profit numeric NOT NULL DEFAULT 0,   -- Gross Profit - OpEx
  
  -- Margin Calculations
  gross_margin numeric NOT NULL DEFAULT 0, -- (Gross Profit / Revenue) * 100
  net_margin numeric NOT NULL DEFAULT 0,   -- (Net Profit / Revenue) * 100
  
  -- Metadata
  calculation_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, period, period_type)
);

-- 6. PURCHASES TABLE
-- Untuk tracking pembelian bahan baku
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  supplier text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_nilai numeric NOT NULL DEFAULT 0 CHECK (total_nilai >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  metode_perhitungan text DEFAULT 'manual',
  catatan text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 7. SUPPLIERS TABLE
-- Untuk data supplier
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama text NOT NULL,
  kontak text,
  email text,
  telepon text,
  alamat text,
  catatan text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, nama)
);

-- 8. RECIPES TABLE (HPP Recipes)
-- Untuk recipe costing
CREATE TABLE IF NOT EXISTS public.hpp_recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_resep text NOT NULL,
  deskripsi text,
  porsi integer NOT NULL DEFAULT 1 CHECK (porsi > 0),
  ingredients jsonb DEFAULT '[]'::jsonb, -- Array of {bahan_baku_id, qty}
  bahan_resep jsonb DEFAULT '[]'::jsonb, -- Alias untuk kompatibilitas
  biaya_tenaga_kerja numeric DEFAULT 0 CHECK (biaya_tenaga_kerja >= 0),
  biaya_overhead numeric DEFAULT 0 CHECK (biaya_overhead >= 0),
  total_hpp numeric DEFAULT 0 CHECK (total_hpp >= 0),
  hpp_per_porsi numeric DEFAULT 0 CHECK (hpp_per_porsi >= 0),
  margin_keuntungan numeric DEFAULT 0 CHECK (margin_keuntungan >= 0),
  harga_jual numeric DEFAULT 0 CHECK (harga_jual >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, nama_resep)
);

-- 9. ORDERS TABLE
-- Untuk tracking penjualan
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nomor_pesanan text NOT NULL,
  tanggal_pesanan date NOT NULL DEFAULT CURRENT_DATE,
  customer_name text,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of {recipe_id, qty, price}
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, nomor_pesanan)
);

-- 10. ACTIVITIES TABLE
-- Untuk audit trail dan logging
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text, -- 'stok', 'financial', 'order', etc.
  value text,
  related_id uuid, -- Reference ke record terkait
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- Financial Transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions (date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions (type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date ON public.financial_transactions (user_id, date);

-- Bahan Baku
CREATE INDEX IF NOT EXISTS idx_bahan_baku_user_id ON public.bahan_baku (user_id);
CREATE INDEX IF NOT EXISTS idx_bahan_baku_kategori ON public.bahan_baku (kategori);

-- Operational Costs
CREATE INDEX IF NOT EXISTS idx_operational_costs_user_id ON public.operational_costs (user_id);
CREATE INDEX IF NOT EXISTS idx_operational_costs_group ON public.operational_costs ("group");
CREATE INDEX IF NOT EXISTS idx_operational_costs_status ON public.operational_costs (status);

-- Profit Analysis
CREATE INDEX IF NOT EXISTS idx_profit_analysis_user_id ON public.profit_analysis (user_id);
CREATE INDEX IF NOT EXISTS idx_profit_analysis_period ON public.profit_analysis (period);
CREATE INDEX IF NOT EXISTS idx_profit_analysis_user_period ON public.profit_analysis (user_id, period);

-- Purchases
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_tanggal ON public.purchases (tanggal);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases (status);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_tanggal ON public.orders (tanggal_pesanan);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities (type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities (created_at);

-- =====================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================

-- Enable RLS on all tables
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bahan_baku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hpp_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
-- Financial Transactions
CREATE POLICY "Users can manage their own financial transactions" ON public.financial_transactions
  FOR ALL USING (auth.uid() = user_id);

-- Bahan Baku
CREATE POLICY "Users can manage their own bahan baku" ON public.bahan_baku
  FOR ALL USING (auth.uid() = user_id);

-- Operational Costs
CREATE POLICY "Users can manage their own operational costs" ON public.operational_costs
  FOR ALL USING (auth.uid() = user_id);

-- App Settings
CREATE POLICY "Users can manage their own app settings" ON public.app_settings
  FOR ALL USING (auth.uid() = user_id);

-- Profit Analysis
CREATE POLICY "Users can manage their own profit analysis" ON public.profit_analysis
  FOR ALL USING (auth.uid() = user_id);

-- Purchases
CREATE POLICY "Users can manage their own purchases" ON public.purchases
  FOR ALL USING (auth.uid() = user_id);

-- Suppliers
CREATE POLICY "Users can manage their own suppliers" ON public.suppliers
  FOR ALL USING (auth.uid() = user_id);

-- HPP Recipes
CREATE POLICY "Users can manage their own recipes" ON public.hpp_recipes
  FOR ALL USING (auth.uid() = user_id);

-- Orders
CREATE POLICY "Users can manage their own orders" ON public.orders
  FOR ALL USING (auth.uid() = user_id);

-- Activities
CREATE POLICY "Users can manage their own activities" ON public.activities
  FOR ALL USING (auth.uid() = user_id);

-- =====================================
-- STORED FUNCTIONS
-- =====================================

-- Function untuk calculate WAC (Weighted Average Cost)
CREATE OR REPLACE FUNCTION calculate_wac_price(
  p_user_id uuid,
  p_bahan_id uuid,
  p_new_qty numeric,
  p_new_price numeric
) RETURNS numeric AS $$
DECLARE
  v_current_stock numeric;
  v_current_wac numeric;
  v_new_wac numeric;
BEGIN
  -- Get current stock and WAC
  SELECT stok, COALESCE(harga_rata_rata, harga_satuan)
  INTO v_current_stock, v_current_wac
  FROM bahan_baku
  WHERE id = p_bahan_id AND user_id = p_user_id;
  
  -- Calculate new WAC
  IF v_current_stock = 0 THEN
    v_new_wac := p_new_price;
  ELSE
    v_new_wac := ((v_current_stock * v_current_wac) + (p_new_qty * p_new_price)) / (v_current_stock + p_new_qty);
  END IF;
  
  RETURN v_new_wac;
END;
$$ LANGUAGE plpgsql;

-- Function untuk get profit analysis data
CREATE OR REPLACE FUNCTION get_profit_analysis_data(
  p_user_id uuid,
  p_period text DEFAULT NULL,
  p_period_type text DEFAULT 'monthly'
) RETURNS TABLE (
  period text,
  total_revenue numeric,
  total_cogs numeric,
  total_opex numeric,
  gross_profit numeric,
  net_profit numeric,
  gross_margin numeric,
  net_margin numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.period,
    pa.total_revenue,
    pa.total_cogs,
    pa.total_opex,
    pa.gross_profit,
    pa.net_profit,
    pa.gross_margin,
    pa.net_margin
  FROM profit_analysis pa
  WHERE pa.user_id = p_user_id
    AND (p_period IS NULL OR pa.period = p_period)
    AND pa.period_type = p_period_type
  ORDER BY pa.period DESC;
END;
$$ LANGUAGE plpgsql;

-- Function untuk calculate real-time profit
CREATE OR REPLACE FUNCTION calculate_realtime_profit(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS TABLE (
  total_revenue numeric,
  total_cogs numeric,
  total_opex numeric,
  gross_profit numeric,
  net_profit numeric
) AS $$
DECLARE
  v_revenue numeric := 0;
  v_cogs numeric := 0;
  v_opex numeric := 0;
  v_days_in_period integer;
BEGIN
  -- Calculate revenue from financial transactions
  SELECT COALESCE(SUM(amount), 0)
  INTO v_revenue
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND date BETWEEN p_start_date AND p_end_date;
  
  -- Calculate COGS (simplified - could be enhanced with actual usage data)
  -- For now, use a percentage of revenue or actual material costs
  
  -- Calculate operational expenses
  v_days_in_period := p_end_date - p_start_date + 1;
  
  SELECT COALESCE(SUM(jumlah_per_bulan * v_days_in_period / 30.0), 0)
  INTO v_opex
  FROM operational_costs
  WHERE user_id = p_user_id
    AND status = 'aktif';
  
  -- Return calculated values
  RETURN QUERY SELECT 
    v_revenue,
    v_cogs,
    v_opex,
    v_revenue - v_cogs AS gross_profit,
    v_revenue - v_cogs - v_opex AS net_profit;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- TRIGGERS
-- =====================================

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger ke semua tabel
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bahan_baku_updated_at
  BEFORE UPDATE ON public.bahan_baku
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operational_costs_updated_at
  BEFORE UPDATE ON public.operational_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profit_analysis_updated_at
  BEFORE UPDATE ON public.profit_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hpp_recipes_updated_at
  BEFORE UPDATE ON public.hpp_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- SAMPLE DATA SEEDER
-- =====================================

-- Function untuk insert sample data
CREATE OR REPLACE FUNCTION seed_profit_analysis_sample_data(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert sample app settings
  INSERT INTO app_settings (user_id, target_produksi_per_bulan, overhead_per_pcs, operasional_per_pcs)
  VALUES (p_user_id, 1000, 500, 300)
  ON CONFLICT (user_id) DO UPDATE SET
    target_produksi_per_bulan = EXCLUDED.target_produksi_per_bulan,
    overhead_per_pcs = EXCLUDED.overhead_per_pcs,
    operasional_per_pcs = EXCLUDED.operasional_per_pcs;
  
  -- Insert sample bahan baku
  INSERT INTO bahan_baku (user_id, nama, kategori, stok, satuan, harga_satuan, harga_rata_rata)
  VALUES 
    (p_user_id, 'Tepung Terigu', 'Bahan Utama', 50, 'kg', 12000, 12000),
    (p_user_id, 'Gula Pasir', 'Bahan Utama', 25, 'kg', 15000, 15000),
    (p_user_id, 'Telur Ayam', 'Bahan Utama', 100, 'butir', 2500, 2500),
    (p_user_id, 'Mentega', 'Bahan Utama', 10, 'kg', 45000, 45000)
  ON CONFLICT (user_id, nama) DO NOTHING;
  
  -- Insert sample operational costs
  INSERT INTO operational_costs (user_id, nama_biaya, jumlah_per_bulan, jenis, "group")
  VALUES 
    (p_user_id, 'Sewa Tempat', 2000000, 'tetap', 'operasional'),
    (p_user_id, 'Listrik', 500000, 'variabel', 'operasional'),
    (p_user_id, 'Gas LPG', 300000, 'variabel', 'hpp'),
    (p_user_id, 'Tenaga Kerja', 1500000, 'tetap', 'hpp')
  ON CONFLICT DO NOTHING;
  
  -- Insert sample financial transactions
  INSERT INTO financial_transactions (user_id, type, category, amount, description, date)
  VALUES 
    (p_user_id, 'income', 'Penjualan', 500000, 'Penjualan kue hari ini', CURRENT_DATE),
    (p_user_id, 'income', 'Penjualan', 750000, 'Penjualan roti', CURRENT_DATE - 1),
    (p_user_id, 'income', 'Penjualan', 600000, 'Penjualan pastry', CURRENT_DATE - 2),
    (p_user_id, 'expense', 'Bahan Baku', 200000, 'Pembelian tepung', CURRENT_DATE - 1),
    (p_user_id, 'expense', 'Operasional', 100000, 'Bayar listrik', CURRENT_DATE - 3)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Sample data berhasil ditambahkan untuk user %', p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON TABLE public.financial_transactions IS 'Transaksi keuangan untuk tracking revenue dan expenses';
COMMENT ON TABLE public.bahan_baku IS 'Master data bahan baku dengan support WAC calculation';
COMMENT ON TABLE public.operational_costs IS 'Biaya operasional bulanan (tetap dan variabel)';
COMMENT ON TABLE public.app_settings IS 'Pengaturan global untuk cost allocation';
COMMENT ON TABLE public.profit_analysis IS 'Hasil analisis profit per periode';
COMMENT ON TABLE public.purchases IS 'Data pembelian bahan baku';
COMMENT ON TABLE public.suppliers IS 'Master data supplier';
COMMENT ON TABLE public.hpp_recipes IS 'Recipe costing untuk calculate COGS';
COMMENT ON TABLE public.orders IS 'Data penjualan/pesanan';
COMMENT ON TABLE public.activities IS 'Audit trail dan logging aktivitas';

COMMENT ON COLUMN public.bahan_baku.harga_rata_rata IS 'Weighted Average Cost - calculated automatically';
COMMENT ON COLUMN public.bahan_baku.harga_satuan IS 'Base unit price - manual input or fallback';
COMMENT ON COLUMN public.operational_costs."group" IS 'Cost grouping: hpp, operasional';
COMMENT ON COLUMN public.profit_analysis.period IS 'Period format: YYYY-MM for monthly, YYYY-Q1 for quarterly';

-- =====================================
-- VERIFICATION
-- =====================================

-- Query untuk verify schema
SELECT 
  'Schema created successfully' as status,
  (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'financial_transactions', 'bahan_baku', 'operational_costs', 
      'app_settings', 'profit_analysis', 'purchases', 'suppliers', 
      'hpp_recipes', 'orders', 'activities'
    )
  ) as tables_created,
  (
    SELECT COUNT(*) 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN (
      'calculate_wac_price', 'get_profit_analysis_data', 
      'calculate_realtime_profit', 'seed_profit_analysis_sample_data'
    )
  ) as functions_created;