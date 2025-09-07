-- TEST WAC TRIGGER - Jalankan setelah create trigger
-- Copy paste ke Supabase SQL Editor

-- 1. CEK APAKAH TRIGGER SUDAH TERBUAT
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    CASE t.tgtype & 66
        WHEN 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as trigger_timing,
    CASE t.tgtype & 28
        WHEN 16 THEN 'UPDATE'
        WHEN 28 THEN 'INSERT, DELETE, UPDATE'
    END as trigger_events
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'purchases'
AND t.tgname = 'trigger_auto_update_wac'
AND NOT t.tgisinternal;

-- 2. CEK FUNCTION TRIGGER ADA
SELECT 
    p.proname as function_name,
    p.proargnames as arguments,
    'Trigger function exists' as status
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'auto_update_wac_on_purchase_completion';

-- 3. SIMULATION TEST (DRY RUN)
-- Cari purchase yang bisa ditest
SELECT 
    id,
    status,
    supplier,
    total_nilai,
    jsonb_array_length(items) as item_count,
    created_at
FROM purchases 
WHERE status = 'pending'
LIMIT 5;

-- 4. TEST MANUAL WAC UPDATE (test function langsung)
-- Ganti 'your-bahan-id' dengan ID bahan yang ada
-- SELECT * FROM update_wac_price(
--     'your-bahan-id'::uuid,
--     'your-user-id'::uuid, 
--     10, 
--     5000
-- );

-- 5. CEK CURRENT WAC VALUES SEBELUM TEST
SELECT 
    id,
    nama,
    stok,
    harga_satuan,
    harga_rata_rata,
    CASE 
        WHEN harga_rata_rata IS NULL OR harga_rata_rata = 0 THEN 'Needs WAC'
        ELSE 'Has WAC'
    END as wac_status
FROM bahan_baku
ORDER BY nama
LIMIT 10;

-- 6. ENABLE TRIGGER LOGGING (uncomment if needed)
-- SET log_statement = 'all';
-- SET log_min_messages = 'notice';

-- INSTRUCTIONS:
-- 1. Jalankan queries 1-2 untuk confirm trigger exists
-- 2. Jalankan query 3 untuk lihat purchases yang bisa ditest  
-- 3. Jalankan query 5 untuk lihat current WAC status
-- 4. Test trigger dengan: UPDATE purchases SET status = 'completed' WHERE id = 'purchase-id-from-step-3';
-- 5. Jalankan query 5 lagi untuk lihat perubahan WAC
