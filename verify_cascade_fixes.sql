-- Verification script for cascade deletion fixes
-- Run this in Supabase SQL Editor to verify everything is working

-- 1. Check if our new functions exist
SELECT 
  routine_name,
  routine_type,
  routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'cleanup_recipe_material_references',
    'enhanced_cleanup_after_cost_deletion', 
    'refresh_financial_views',
    'check_orphaned_records'
  )
ORDER BY routine_name;

-- 2. Check if triggers are active
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_cleanup_recipe_material_references',
    'cleanup_after_cost_deletion'
  );

-- 3. Check if our new indexes exist  
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_financial_transactions_related_id',
    'idx_financial_transactions_user_related',
    'idx_pemakaian_bahan_bahan_user',
    'idx_recipes_bahan_resep_gin'
  );

-- 4. Test the orphaned records check function
SELECT * FROM check_orphaned_records();

-- 5. Check materialized views status
SELECT 
  schemaname,
  matviewname,
  ispopulated,
  hasindexes
FROM pg_matviews 
WHERE schemaname = 'public';

-- 6. Verify foreign key constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND rc.delete_rule = 'CASCADE'
  AND tc.table_name IN ('pemakaian_bahan', 'financial_transactions', 'assets', 'operational_costs')
ORDER BY tc.table_name, tc.constraint_name;
