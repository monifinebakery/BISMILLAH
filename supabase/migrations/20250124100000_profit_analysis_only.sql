-- =====================================
-- PROFIT ANALYSIS SCHEMA - SIMPLIFIED
-- SQL untuk Supabase - Fokus Profit Analysis
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
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. OPERATIONAL COSTS TABLE
-- Untuk biaya operasional bulanan
CREATE TABLE IF NOT EXISTS public.operational_costs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_biaya text NOT NULL,
  jumlah_per_bulan numeric NOT NULL CHECK (jumlah_per_bulan >= 0),
  jenis text NOT NULL CHECK (jenis IN ('tetap', 'variabel')),
  cost_category text,
  "group" text DEFAULT 'operasional',
  status text DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. PROFIT ANALYSIS TABLE
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
  total_cogs numeric NOT NULL DEFAULT 0,
  cogs_breakdown jsonb DEFAULT '[]'::jsonb,
  total_opex numeric NOT NULL DEFAULT 0,
  opex_breakdown jsonb DEFAULT '[]'::jsonb,
  
  -- Profit Calculations
  gross_profit numeric NOT NULL DEFAULT 0,
  net_profit numeric NOT NULL DEFAULT 0,
  
  -- Margin Calculations
  gross_margin numeric NOT NULL DEFAULT 0,
  net_margin numeric NOT NULL DEFAULT 0,
  
  -- Metadata
  calculation_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, period, period_type)
);

-- =====================================
-- INDEXES UNTUK PERFORMANCE
-- =====================================

-- Financial Transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions (date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions (type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date ON public.financial_transactions (user_id, date);

-- Operational Costs
CREATE INDEX IF NOT EXISTS idx_operational_costs_user_id ON public.operational_costs (user_id);
CREATE INDEX IF NOT EXISTS idx_operational_costs_group ON public.operational_costs ("group");
CREATE INDEX IF NOT EXISTS idx_operational_costs_status ON public.operational_costs (status);

-- Profit Analysis
CREATE INDEX IF NOT EXISTS idx_profit_analysis_user_id ON public.profit_analysis (user_id);
CREATE INDEX IF NOT EXISTS idx_profit_analysis_period ON public.profit_analysis (period);
CREATE INDEX IF NOT EXISTS idx_profit_analysis_user_period ON public.profit_analysis (user_id, period);

-- =====================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own financial transactions" ON public.financial_transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own operational costs" ON public.operational_costs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own profit analysis" ON public.profit_analysis
  FOR ALL USING (auth.uid() = user_id);

-- =====================================
-- STORED FUNCTIONS
-- =====================================

-- Function untuk calculate profit analysis
CREATE OR REPLACE FUNCTION calculate_profit_analysis(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS TABLE (
  total_revenue numeric,
  total_cogs numeric,
  total_opex numeric,
  gross_profit numeric,
  net_profit numeric,
  gross_margin numeric,
  net_margin numeric
) AS $$
DECLARE
  v_revenue numeric := 0;
  v_cogs numeric := 0;
  v_opex numeric := 0;
  v_days_in_period integer;
BEGIN
  -- Calculate revenue
  SELECT COALESCE(SUM(amount), 0)
  INTO v_revenue
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND date BETWEEN p_start_date AND p_end_date;
  
  -- Calculate COGS dari expenses dengan category tertentu
  SELECT COALESCE(SUM(amount), 0)
  INTO v_cogs
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND (category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%')
    AND date BETWEEN p_start_date AND p_end_date;
  
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
    v_revenue - v_cogs - v_opex AS net_profit,
    CASE WHEN v_revenue > 0 THEN ((v_revenue - v_cogs) / v_revenue) * 100 ELSE 0 END AS gross_margin,
    CASE WHEN v_revenue > 0 THEN ((v_revenue - v_cogs - v_opex) / v_revenue) * 100 ELSE 0 END AS net_margin;
END;
$$ LANGUAGE plpgsql;

-- Function untuk get revenue breakdown
CREATE OR REPLACE FUNCTION get_revenue_breakdown(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'category', COALESCE(category, 'Lainnya'),
      'amount', total_amount,
      'percentage', ROUND((total_amount / total_revenue * 100)::numeric, 2)
    )
  )
  INTO result
  FROM (
    SELECT 
      category,
      SUM(amount) as total_amount,
      (SELECT SUM(amount) FROM financial_transactions 
       WHERE user_id = p_user_id AND type = 'income' 
       AND date BETWEEN p_start_date AND p_end_date) as total_revenue
    FROM financial_transactions
    WHERE user_id = p_user_id
      AND type = 'income'
      AND date BETWEEN p_start_date AND p_end_date
    GROUP BY category
    ORDER BY total_amount DESC
  ) breakdown;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function untuk get expense breakdown
CREATE OR REPLACE FUNCTION get_expense_breakdown(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'category', COALESCE(category, 'Lainnya'),
      'amount', total_amount,
      'type', 'expense'
    )
  )
  INTO result
  FROM (
    SELECT 
      category,
      SUM(amount) as total_amount
    FROM financial_transactions
    WHERE user_id = p_user_id
      AND type = 'expense'
      AND date BETWEEN p_start_date AND p_end_date
    GROUP BY category
    ORDER BY total_amount DESC
  ) breakdown;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- TRIGGERS
-- =====================================

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operational_costs_updated_at
  BEFORE UPDATE ON public.operational_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profit_analysis_updated_at
  BEFORE UPDATE ON public.profit_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- SAMPLE DATA SEEDER
-- =====================================

-- Function untuk insert sample data
CREATE OR REPLACE FUNCTION seed_profit_sample_data(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert sample operational costs
  INSERT INTO operational_costs (user_id, nama_biaya, jumlah_per_bulan, jenis, "group")
  VALUES 
    (p_user_id, 'Sewa Tempat', 2000000, 'tetap', 'operasional'),
    (p_user_id, 'Listrik', 500000, 'variabel', 'operasional'),
    (p_user_id, 'Internet', 300000, 'tetap', 'operasional'),
    (p_user_id, 'Tenaga Kerja', 1500000, 'tetap', 'operasional')
  ON CONFLICT DO NOTHING;
  
  -- Insert sample financial transactions
  INSERT INTO financial_transactions (user_id, type, category, amount, description, date)
  VALUES 
    (p_user_id, 'income', 'Penjualan', 500000, 'Penjualan hari ini', CURRENT_DATE),
    (p_user_id, 'income', 'Penjualan', 750000, 'Penjualan kemarin', CURRENT_DATE - 1),
    (p_user_id, 'income', 'Penjualan', 600000, 'Penjualan 2 hari lalu', CURRENT_DATE - 2),
    (p_user_id, 'expense', 'Bahan Baku', 200000, 'Pembelian bahan', CURRENT_DATE - 1),
    (p_user_id, 'expense', 'Operasional', 100000, 'Biaya operasional', CURRENT_DATE - 3)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Sample data profit analysis berhasil ditambahkan untuk user %', p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON TABLE public.financial_transactions IS 'Transaksi keuangan untuk tracking revenue dan expenses';
COMMENT ON TABLE public.operational_costs IS 'Biaya operasional bulanan (tetap dan variabel)';
COMMENT ON TABLE public.profit_analysis IS 'Hasil analisis profit per periode';

COMMENT ON COLUMN public.operational_costs."group" IS 'Grouping biaya: operasional, hpp';
COMMENT ON COLUMN public.profit_analysis.period IS 'Format periode: YYYY-MM untuk monthly';

-- =====================================
-- VERIFICATION
-- =====================================

SELECT 
  'Profit Analysis Schema created successfully' as status,
  (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('financial_transactions', 'operational_costs', 'profit_analysis')
  ) as tables_created,
  (
    SELECT COUNT(*) 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('calculate_profit_analysis', 'get_revenue_breakdown', 'get_expense_breakdown')
  ) as functions_created;