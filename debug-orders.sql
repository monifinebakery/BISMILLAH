-- Debug Orders Table - Run these queries in Supabase SQL Editor
-- atau via psql jika Anda punya connection string

-- 1. CEK STRUKTUR TABEL ORDERS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. CEK DATA ORDERS TERBARU
SELECT 
    id,
    user_id,
    nomor_pesanan,
    status,
    nama_pelanggan,
    created_at,
    updated_at
FROM public.orders 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. CEK APAKAH ADA UUID YANG TIDAK VALID
SELECT 
    id,
    user_id,
    nomor_pesanan,
    status,
    CASE 
        WHEN id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'Valid UUID'
        ELSE 'Invalid UUID: ' || id::text
    END as id_status,
    CASE 
        WHEN user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'Valid UUID'
        ELSE 'Invalid UUID: ' || user_id::text
    END as user_id_status
FROM public.orders 
WHERE NOT (
    id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- 4. CEK STATUS VALUES
SELECT 
    status,
    COUNT(*) as count
FROM public.orders 
GROUP BY status
ORDER BY count DESC;

-- 5. CEK APAKAH ADA DATA YANG MENGANDUNG '[object Object]'
SELECT 
    id,
    user_id,
    nomor_pesanan,
    status,
    nama_pelanggan
FROM public.orders 
WHERE id::text LIKE '%object%' 
   OR user_id::text LIKE '%object%'
   OR status LIKE '%object%'
   OR nomor_pesanan LIKE '%object%'
   OR nama_pelanggan LIKE '%object%';

-- 6. CEK CONSTRAINT YANG ADA DI TABEL ORDERS
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'orders'
  AND tc.table_schema = 'public';

-- 7. CEK RLS POLICIES (Row Level Security)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'orders';

-- 8. TEST UPDATE QUERY SEDERHANA (HATI-HATI!)
-- Ganti 'YOUR_ORDER_ID' dan 'YOUR_USER_ID' dengan ID yang valid
/*
UPDATE public.orders 
SET status = 'confirmed', updated_at = NOW()
WHERE id = 'YOUR_ORDER_ID' 
  AND user_id = 'YOUR_USER_ID';
*/

-- 9. CEK LOG RECENT ACTIVITIES (jika ada audit table)
-- Sesuaikan dengan nama table log yang Anda gunakan
/*
SELECT * FROM audit_logs 
WHERE table_name = 'orders' 
  AND operation = 'UPDATE'
ORDER BY created_at DESC 
LIMIT 20;
*/

-- 10. CEK FUNCTIONS YANG BERKAITAN DENGAN ORDERS
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%order%';

-- 11. DEBUGGING: Simulate parameter passing issue
-- Ini akan gagal jika Anda coba pass object sebagai UUID
/*
DO $$
DECLARE
    test_result record;
BEGIN
    -- Test case yang akan berhasil
    SELECT * INTO test_result 
    FROM orders 
    WHERE id = 'valid-uuid-here'::uuid 
    LIMIT 1;
    
    RAISE NOTICE 'Test passed: Found order with valid UUID';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;
*/
