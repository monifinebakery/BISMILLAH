-- =====================================
-- Schema Updates for Warehouse-Purchase Integration
-- Fixed: Remove applied_at field and ensure manual sync compatibility
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

-- 3. Remove applied_at column from purchases table if it still exists
DO $$
BEGIN
  -- Drop policies that depend on applied_at column first
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_items_update_own_unapplied') THEN
    DROP POLICY purchase_items_update_own_unapplied ON purchase_items;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_items_delete_own_unapplied') THEN
    DROP POLICY purchase_items_delete_own_unapplied ON purchase_items;
  END IF;
  
  -- Remove applied_at column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'applied_at'
  ) THEN
    ALTER TABLE public.purchases DROP COLUMN applied_at;
  END IF;
END $$;

-- 4. Remove any trigger-specific indexes that reference applied_at
DROP INDEX IF EXISTS idx_purchases_status_applied;
DROP INDEX IF EXISTS idx_purchases_applied_at;
DROP INDEX IF EXISTS idx_purchases_user_applied;

-- 5. Drop any warehouse synchronization triggers and functions
DROP TRIGGER IF EXISTS trigger_purchase_warehouse_sync ON purchases;
DROP FUNCTION IF EXISTS handle_purchase_warehouse_sync();
DROP FUNCTION IF EXISTS apply_purchase_to_warehouse(purchases);
DROP FUNCTION IF EXISTS reverse_purchase_from_warehouse(purchases);
DROP FUNCTION IF EXISTS calculate_warehouse_wac(UUID, UUID, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS sync_all_warehouse_wac(UUID);

-- 6. Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bahan_baku_harga_rata_rata ON bahan_baku(user_id, harga_rata_rata);

-- 7. Ensure the update trigger exists for bahan_baku
DROP TRIGGER IF EXISTS update_bahan_baku_updated_at ON bahan_baku;
CREATE TRIGGER update_bahan_baku_updated_at 
  BEFORE UPDATE ON bahan_baku 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Comments for documentation
COMMENT ON COLUMN bahan_baku.harga_rata_rata IS 'Weighted Average Cost for inventory valuation - manual sync';
COMMENT ON TABLE purchases IS 'Purchase orders with manual warehouse synchronization (no applied_at field)';

-- 9. Verify schema is correct
SELECT 
  'Schema verification completed' as status,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'applied_at'
  ) as applied_at_columns_remaining,
  (
    SELECT COUNT(*) 
    FROM pg_trigger 
    WHERE tgname = 'trigger_purchase_warehouse_sync'
  ) as warehouse_triggers_remaining;