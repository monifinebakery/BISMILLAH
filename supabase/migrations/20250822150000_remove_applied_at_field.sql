-- Remove applied_at field and fix manual warehouse sync
-- This migration fixes the "record new has no field applied_at" error

-- 1. Drop any policies that depend on applied_at column
DROP POLICY IF EXISTS purchase_items_update_own_unapplied ON purchase_items;
DROP POLICY IF EXISTS purchase_items_delete_own_unapplied ON purchase_items;

-- 2. Drop any triggers that might reference applied_at
DROP TRIGGER IF EXISTS trigger_purchase_warehouse_sync ON purchases;

-- 3. Drop any functions that might set applied_at
DROP FUNCTION IF EXISTS handle_purchase_warehouse_sync();
DROP FUNCTION IF EXISTS apply_purchase_to_warehouse(purchases);
DROP FUNCTION IF EXISTS reverse_purchase_from_warehouse(purchases);
DROP FUNCTION IF EXISTS calculate_warehouse_wac(UUID, UUID, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS sync_all_warehouse_wac(UUID);

-- 4. Remove trigger-specific indexes that might reference applied_at
DROP INDEX IF EXISTS idx_purchases_status_applied;
DROP INDEX IF EXISTS idx_purchases_applied_at;
DROP INDEX IF EXISTS idx_purchases_user_applied;

-- 5. Remove the applied_at column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'applied_at'
  ) THEN
    ALTER TABLE public.purchases DROP COLUMN applied_at;
    RAISE NOTICE 'Removed applied_at column from purchases table';
  ELSE
    RAISE NOTICE 'applied_at column does not exist in purchases table';
  END IF;
END $$;

-- 6. Ensure purchases table has correct structure for manual sync
DO $$
BEGIN
  -- Ensure status column exists and has correct type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN status text DEFAULT 'pending';
  END IF;
  
  -- Ensure metode_perhitungan column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'metode_perhitungan'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN metode_perhitungan text DEFAULT 'AVERAGE';
  END IF;
END $$;

-- 7. Add helpful indexes for manual sync
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);

-- 8. Add comments to document manual sync approach
COMMENT ON TABLE purchases IS 'Purchase orders with manual warehouse synchronization (no applied_at field)';
COMMENT ON COLUMN purchases.status IS 'Status: pending, completed, cancelled - manual sync on completed';

-- 9. Verify the fix
SELECT 
  'Applied_at field removal completed' as status,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'applied_at'
  ) as applied_at_columns_remaining,
  (
    SELECT COUNT(*) 
    FROM pg_trigger 
    WHERE tgname LIKE '%warehouse%'
  ) as warehouse_triggers_remaining;