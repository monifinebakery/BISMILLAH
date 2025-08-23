-- =====================================
-- CORRECTED BAHAN_BAKU TABLE SCHEMA
-- Includes all fields needed for automatic price calculation and WAC system
-- =====================================

CREATE TABLE public.bahan_baku (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nama text NOT NULL,
  kategori text NOT NULL,
  stok numeric NOT NULL DEFAULT 0,
  satuan text NOT NULL,
  minimum numeric NOT NULL DEFAULT 0,
  harga_satuan numeric NOT NULL DEFAULT 0,
  harga_rata_rata numeric NULL, -- ✅ CRITICAL: WAC field for automatic calculation
  supplier text NULL,
  tanggal_kadaluwarsa date NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Primary key
  CONSTRAINT bahan_baku_pkey PRIMARY KEY (id),
  
  -- Unique constraint
  CONSTRAINT bahan_baku_unique_user_nama UNIQUE (user_id, nama),
  
  -- Foreign key
  CONSTRAINT fk_bahan_baku_user FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE,
  
  -- Check constraints
  CONSTRAINT bahan_baku_nonnegative_wac CHECK (
    (harga_rata_rata IS NULL) OR (harga_rata_rata >= 0)
  ),
  CONSTRAINT bahan_baku_nonnegatives CHECK (
    (stok >= 0) AND 
    (minimum >= 0) AND 
    (harga_satuan >= 0)
  )
) TABLESPACE pg_default;

-- =====================================
-- OPTIMIZED INDEXES
-- =====================================

-- Core indexes for performance
CREATE INDEX IF NOT EXISTS idx_bahan_baku_user_id 
  ON public.bahan_baku USING btree (user_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_bahan_baku_nama 
  ON public.bahan_baku USING btree (nama) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_bahan_baku_user_kategori 
  ON public.bahan_baku USING btree (user_id, kategori) 
  TABLESPACE pg_default;

-- ✅ CRITICAL: Index for WAC operations
CREATE INDEX IF NOT EXISTS idx_bahan_baku_harga_rata_rata 
  ON public.bahan_baku USING btree (user_id, harga_rata_rata) 
  TABLESPACE pg_default;

-- Low stock monitoring (partial index for performance)
CREATE INDEX IF NOT EXISTS idx_bahan_baku_low_stock 
  ON public.bahan_baku USING btree (user_id, stok) 
  TABLESPACE pg_default
  WHERE (stok <= minimum);

-- =====================================
-- TRIGGERS
-- =====================================

-- Single updated_at trigger (remove duplicates)
DROP TRIGGER IF EXISTS trg_bahan_baku_updated_at ON bahan_baku;
DROP TRIGGER IF EXISTS update_bahan_baku_updated_at ON bahan_baku;

CREATE TRIGGER update_bahan_baku_updated_at 
  BEFORE UPDATE ON bahan_baku 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================

COMMENT ON TABLE public.bahan_baku IS 
  'Warehouse raw materials with automatic price calculation support';

COMMENT ON COLUMN public.bahan_baku.harga_rata_rata IS 
  'Weighted Average Cost (WAC) - calculated automatically from purchase history';

COMMENT ON COLUMN public.bahan_baku.harga_satuan IS 
  'Base unit price - manual input or fallback when WAC not available';

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bahan_baku' 
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'bahan_baku'
ORDER BY indexname;

-- Check constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.bahan_baku'::regclass;