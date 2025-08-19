-- =====================================
-- WAC Trigger Verification Script
-- =====================================

-- Check if required functions exist
SELECT proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN (
  'calculate_warehouse_wac',
  'apply_purchase_to_warehouse', 
  'reverse_purchase_from_warehouse',
  'handle_purchase_warehouse_sync'
)
ORDER BY proname;

-- Check if trigger exists
SELECT 
  tgname as trigger_name,
  relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname = 'trigger_purchase_warehouse_sync';

-- Check if required columns exist
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('bahan_baku', 'purchases')
AND column_name IN ('harga_rata_rata', 'applied_at', 'bahan_baku_id')
ORDER BY table_name, column_name;

-- Verify bahan_baku table has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'bahan_baku' 
AND column_name IN (
  'id', 'user_id', 'nama', 'kategori', 'stok', 'satuan', 'minimum', 
  'harga_satuan', 'supplier', 'tanggal_kadaluwarsa', 'created_at', 
  'updated_at', 'harga_rata_rata'
)
ORDER BY ordinal_position;

-- Verify purchases table has correct structure for items JSONB
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND column_name IN (
  'id', 'user_id', 'supplier', 'tanggal', 'total_nilai', 'items', 
  'status', 'metode_perhitungan', 'created_at', 'updated_at', 'applied_at'
)
ORDER BY ordinal_position;