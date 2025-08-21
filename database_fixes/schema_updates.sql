-- =====================================
-- Schema Updates for Warehouse-Purchase Integration
-- =====================================

-- 1. Fix bahan_baku table - Remove duplicate harga_rata2 column
DO $$
BEGIN
  -- Remove duplicate harga_rata2 column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bahan_baku' AND column_name = 'harga_rata2'
  ) THEN
    ALTER TABLE public.bahan_baku DROP COLUMN harga_rata2;
  END IF;
END $$;

-- 2. Ensure all required columns exist in bahan_baku
DO $$
BEGIN
  -- Add harga_rata_rata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bahan_baku' AND column_name = 'harga_rata_rata'
  ) THEN
    ALTER TABLE public.bahan_baku ADD COLUMN harga_rata_rata NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 3. Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bahan_baku_harga_rata_rata ON bahan_baku(user_id, harga_rata_rata);

-- 4. Ensure the update trigger exists for bahan_baku
DROP TRIGGER IF EXISTS update_bahan_baku_updated_at ON bahan_baku;
CREATE TRIGGER update_bahan_baku_updated_at 
  BEFORE UPDATE ON bahan_baku 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Comments for documentation
COMMENT ON COLUMN bahan_baku.harga_rata_rata IS 'Weighted Average Cost for inventory valuation - manual sync';