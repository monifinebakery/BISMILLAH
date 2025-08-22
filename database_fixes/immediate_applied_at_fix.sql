-- Immediate fix for applied_at field error
-- This script must be run in the Supabase database to completely remove applied_at references

-- 1. Check current schema
DO $$
BEGIN
  RAISE NOTICE 'Current purchases table columns:';
END $$;

SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'purchases' 
ORDER BY ordinal_position;

-- 2. Drop any remaining triggers that might be setting applied_at
DROP TRIGGER IF EXISTS trigger_purchase_warehouse_sync ON purchases CASCADE;
DROP TRIGGER IF EXISTS update_purchases_applied_at ON purchases CASCADE;
DROP TRIGGER IF EXISTS auto_apply_purchase_warehouse ON purchases CASCADE;
DROP TRIGGER IF EXISTS set_applied_at_trigger ON purchases CASCADE;

-- 3. Drop any functions that might be setting applied_at
DROP FUNCTION IF EXISTS handle_purchase_warehouse_sync() CASCADE;
DROP FUNCTION IF EXISTS apply_purchase_to_warehouse() CASCADE;
DROP FUNCTION IF EXISTS set_purchase_applied_at() CASCADE;
DROP FUNCTION IF EXISTS update_purchase_applied_at() CASCADE;
DROP FUNCTION IF EXISTS auto_set_applied_at() CASCADE;

-- 4. Drop any policies that reference applied_at
DROP POLICY IF EXISTS purchase_items_update_own_unapplied ON purchase_items;
DROP POLICY IF EXISTS purchase_items_delete_own_unapplied ON purchase_items;
DROP POLICY IF EXISTS purchases_applied_at_policy ON purchases;

-- 5. Remove any indexes that reference applied_at
DROP INDEX IF EXISTS idx_purchases_status_applied;
DROP INDEX IF EXISTS idx_purchases_applied_at;
DROP INDEX IF EXISTS idx_purchases_user_applied;
DROP INDEX IF EXISTS idx_purchases_applied_at_status;

-- 6. Remove the applied_at column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'applied_at'
  ) THEN
    ALTER TABLE public.purchases DROP COLUMN applied_at CASCADE;
    RAISE NOTICE 'Successfully removed applied_at column from purchases table';
  ELSE
    RAISE NOTICE 'applied_at column does not exist in purchases table';
  END IF;
END $$;

-- 7. Check for any remaining functions that mention applied_at
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%applied_at%'
  AND routine_schema = 'public';

-- 8. Check for any remaining triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'purchases';

-- 9. Verify the fix
DO $$
BEGIN
  RAISE NOTICE 'Verification completed:';
  RAISE NOTICE 'Applied_at columns remaining: %', 
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'purchases' AND column_name = 'applied_at');
  RAISE NOTICE 'Warehouse triggers remaining: %',
    (SELECT COUNT(*) FROM information_schema.triggers 
     WHERE event_object_table = 'purchases' AND trigger_name ILIKE '%warehouse%');
END $$;