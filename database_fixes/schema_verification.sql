-- =====================================
-- Schema Verification Script
-- =====================================

-- Verify bahan_baku table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bahan_baku' 
ORDER BY ordinal_position;

-- Verify purchases table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('bahan_baku', 'purchases')
ORDER BY tablename, indexname;

-- Verify triggers
SELECT 
  tgname as trigger_name,
  relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN ('bahan_baku', 'purchases');

-- Check for any duplicate columns
SELECT 
  column_name,
  COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'bahan_baku' 
GROUP BY column_name
HAVING COUNT(*) > 1;

-- Check for any duplicate columns in purchases
SELECT 
  column_name,
  COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'purchases' 
GROUP BY column_name
HAVING COUNT(*) > 1;