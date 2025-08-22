-- =====================================
-- Add harga_per_satuan column to bahan_baku table
-- This field stores the unit price directly from purchase transactions
-- =====================================

-- Add harga_per_satuan column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bahan_baku' AND column_name = 'harga_per_satuan'
  ) THEN
    ALTER TABLE public.bahan_baku ADD COLUMN harga_per_satuan NUMERIC(15,2) DEFAULT 0;
    
    -- Add comment for documentation
    COMMENT ON COLUMN bahan_baku.harga_per_satuan IS 'Unit price from purchase transactions - used for display and comparison with WAC';
    
    RAISE NOTICE 'Added harga_per_satuan column to bahan_baku table';
  ELSE
    RAISE NOTICE 'harga_per_satuan column already exists in bahan_baku table';
  END IF;
END $$;

-- Create index for better performance when filtering by unit price
CREATE INDEX IF NOT EXISTS idx_bahan_baku_harga_per_satuan ON bahan_baku(user_id, harga_per_satuan) WHERE harga_per_satuan > 0;

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bahan_baku' AND column_name = 'harga_per_satuan';