-- =====================================
-- Remove WAC Database Triggers Script
-- =====================================
-- This script removes all database triggers and functions 
-- for warehouse synchronization to use manual synchronization instead

-- 1. Drop the main trigger
DROP TRIGGER IF EXISTS trigger_purchase_warehouse_sync ON purchases;

-- 2. Drop all related functions
DROP FUNCTION IF EXISTS handle_purchase_warehouse_sync();
DROP FUNCTION IF EXISTS apply_purchase_to_warehouse(purchases);
DROP FUNCTION IF EXISTS reverse_purchase_from_warehouse(purchases);
DROP FUNCTION IF EXISTS calculate_warehouse_wac(UUID, UUID, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS sync_all_warehouse_wac(UUID);

-- 3. Remove trigger-specific indexes (keep basic ones)
DROP INDEX IF EXISTS idx_purchases_status_applied;

-- 4. Drop policies that depend on applied_at column
DROP POLICY IF EXISTS purchase_items_update_own_unapplied ON purchase_items;
DROP POLICY IF EXISTS purchase_items_delete_own_unapplied ON purchase_items;

-- 5. Remove applied_at column since we're using manual sync
ALTER TABLE purchases DROP COLUMN IF EXISTS applied_at;

-- 6. Keep the harga_rata_rata column as it's still needed for manual WAC calculation
-- (We don't drop this as it's still useful for storing WAC values)

-- 7. Verify trigger removal
SELECT 
  'Trigger Removal Complete' as status,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trigger_purchase_warehouse_sync') as remaining_triggers,
  (SELECT COUNT(*) FROM pg_proc WHERE proname IN (
    'handle_purchase_warehouse_sync',
    'apply_purchase_to_warehouse', 
    'reverse_purchase_from_warehouse',
    'calculate_warehouse_wac',
    'sync_all_warehouse_wac'
  )) as remaining_functions;

COMMENT ON TABLE purchases IS 'Purchases table - warehouse sync handled manually';
COMMENT ON COLUMN bahan_baku.harga_rata_rata IS 'Weighted Average Cost - calculated manually';