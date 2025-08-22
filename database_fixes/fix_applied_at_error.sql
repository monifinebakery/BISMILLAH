-- Fix for "record new has no field applied_at" error
-- This script ensures the database is properly configured for manual synchronization

-- 1. Drop any remaining warehouse synchronization triggers and functions
DROP TRIGGER IF EXISTS trigger_purchase_warehouse_sync ON purchases;
DROP TRIGGER IF EXISTS update_purchases_applied_at ON purchases;
DROP TRIGGER IF EXISTS auto_apply_purchase_warehouse ON purchases;

-- 2. Drop any functions that might be setting applied_at
DROP FUNCTION IF EXISTS handle_purchase_warehouse_sync() CASCADE;
DROP FUNCTION IF EXISTS apply_purchase_to_warehouse() CASCADE;
DROP FUNCTION IF EXISTS set_purchase_applied_at() CASCADE;
DROP FUNCTION IF EXISTS update_purchase_applied_at() CASCADE;

-- 3. Remove applied_at column completely
ALTER TABLE purchases DROP COLUMN IF EXISTS applied_at CASCADE;

-- 4. Remove any policies that reference applied_at
DROP POLICY IF EXISTS purchase_items_update_own_unapplied ON purchase_items;
DROP POLICY IF EXISTS purchase_items_delete_own_unapplied ON purchase_items;

-- 5. Remove any indexes that reference applied_at
DROP INDEX IF EXISTS idx_purchases_status_applied;
DROP INDEX IF EXISTS idx_purchases_applied_at;
DROP INDEX IF EXISTS idx_purchases_user_applied;

-- 6. Verify the fix
SELECT 
  'Database cleanup completed' as status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'applied_at') as applied_at_remaining,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%applied%' OR tgname LIKE '%warehouse%') as warehouse_triggers_remaining;

-- 7. Show current purchases table structure to confirm
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
ORDER BY ordinal_position;