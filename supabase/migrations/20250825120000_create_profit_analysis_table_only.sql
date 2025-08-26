-- =====================================
-- PROFIT ANALYSIS TABLE ONLY
-- Migration khusus untuk tabel profit_analysis
-- Tabel lain sudah ada
-- =====================================

-- PROFIT ANALYSIS TABLE
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

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- Profit Analysis
CREATE INDEX IF NOT EXISTS idx_profit_analysis_user_id ON public.profit_analysis (user_id);
CREATE INDEX IF NOT EXISTS idx_profit_analysis_period ON public.profit_analysis (period);
CREATE INDEX IF NOT EXISTS idx_profit_analysis_user_period ON public.profit_analysis (user_id, period);

-- =====================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================

-- Enable RLS
ALTER TABLE public.profit_analysis ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own profit analysis" ON public.profit_analysis
  FOR ALL USING (auth.uid() = user_id);

-- =====================================
-- TRIGGERS
-- =====================================

-- Update timestamp trigger (reuse existing function)
CREATE TRIGGER update_profit_analysis_updated_at
  BEFORE UPDATE ON public.profit_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON TABLE public.profit_analysis IS 'Hasil analisis profit per periode';
COMMENT ON COLUMN public.profit_analysis.period IS 'Format periode: YYYY-MM untuk monthly, YYYY-Q1 untuk quarterly';

-- =====================================
-- VERIFICATION
-- =====================================

-- Query untuk verify tabel profit_analysis sudah dibuat
SELECT 
  'Profit Analysis Table created successfully' as status,
  (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profit_analysis'
  ) as table_created;
