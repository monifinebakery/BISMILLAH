-- =====================================
-- TEST LANGSUNG FUNGSI OPERATIONAL COSTS
-- =====================================

-- 1. DAPATKAN USER ID AKTUAL (dari Supabase Auth)
SELECT auth.uid() as current_user_id;

-- ATAU jika tidak menggunakan RLS, cari user_id dari data yang ada:
SELECT DISTINCT user_id 
FROM operational_costs 
LIMIT 5;

-- =====================================
-- 2. TEST FUNGSI DENGAN USER ID YANG BENAR
-- =====================================

-- Ganti dengan user_id yang benar dari query di atas
DO $$ 
DECLARE
    test_user_id uuid;
BEGIN
    -- Ambil user_id pertama yang ada data
    SELECT user_id INTO test_user_id 
    FROM operational_costs 
    LIMIT 1;
    
    -- Test berbagai query dengan user_id yang benar
    RAISE NOTICE 'Testing dengan User ID: %', test_user_id;
    
    -- Test 1: Data dasar
    RAISE NOTICE '=== TEST 1: Data Dasar ===';
    PERFORM * FROM (
        SELECT 
            COUNT(*) as total_records,
            SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif_count,
            SUM(jumlah_per_bulan) as total_amount
        FROM operational_costs 
        WHERE user_id = test_user_id
    ) t;
    
END $$;

-- =====================================
-- 3. TEST FUNGSI get_operational_costs_allocated
-- =====================================

-- Manual test dengan user_id yang pasti ada
WITH test_user AS (
    SELECT user_id 
    FROM operational_costs 
    WHERE status = 'aktif' 
    LIMIT 1
)
SELECT 
    'Testing get_operational_costs_allocated' as test_name,
    opc.*
FROM test_user tu
CROSS JOIN get_operational_costs_allocated(tu.user_id) opc;

-- =====================================
-- 4. DEBUG MENGAPA NILAI BISA 0
-- =====================================

-- Test aggregasi manual dengan user_id yang sama
WITH test_user AS (
    SELECT user_id 
    FROM operational_costs 
    WHERE status = 'aktif' 
    LIMIT 1
),
manual_agg AS (
    SELECT 
        tu.user_id,
        COUNT(*) as record_count,
        SUM(oc.jumlah_per_bulan) as total_monthly,
        SUM(CASE WHEN oc.jenis = 'tetap' THEN oc.jumlah_per_bulan ELSE 0 END) as fixed_costs,
        SUM(CASE WHEN oc.jenis = 'variabel' THEN oc.jumlah_per_bulan ELSE 0 END) as variable_costs,
        SUM(CASE WHEN oc."group" ILIKE '%operasional%' THEN oc.jumlah_per_bulan ELSE 0 END) as ops_costs
    FROM test_user tu
    JOIN operational_costs oc ON oc.user_id = tu.user_id
    WHERE oc.status = 'aktif'
    GROUP BY tu.user_id
)
SELECT 
    'Manual Aggregation' as test_type,
    ma.*,
    -- Compare with function result
    func.total_monthly_costs as func_total_monthly,
    func.fixed_costs as func_fixed,
    func.operational_costs_only as func_ops
FROM manual_agg ma
CROSS JOIN get_operational_costs_allocated(ma.user_id) func;

-- =====================================
-- 5. CEK MASALAH KOLOM GROUP
-- =====================================

WITH test_user AS (
    SELECT user_id 
    FROM operational_costs 
    WHERE status = 'aktif' 
    LIMIT 1
)
SELECT 
    tu.user_id,
    oc.nama_biaya,
    oc.jumlah_per_bulan,
    oc.jenis,
    oc.status,
    oc."group",
    CASE 
        WHEN oc."group" IS NULL THEN 'NULL'
        WHEN oc."group" = '' THEN 'EMPTY'  
        WHEN LENGTH(TRIM(oc."group")) = 0 THEN 'WHITESPACE'
        WHEN oc."group" ILIKE '%operasional%' THEN 'MATCHES_OPERASIONAL'
        WHEN oc."group" ILIKE '%hpp%' THEN 'MATCHES_HPP'
        ELSE 'NO_MATCH: ' || oc."group"
    END as group_analysis,
    oc."group" ILIKE '%operasional%' as will_match_operasional,
    oc."group" ILIKE '%hpp%' as will_match_hpp
FROM test_user tu
JOIN operational_costs oc ON oc.user_id = tu.user_id
WHERE oc.status = 'aktif'
ORDER BY oc.jumlah_per_bulan DESC;

-- =====================================
-- 6. TEST get_comprehensive_dashboard_summary  
-- =====================================

WITH test_user AS (
    SELECT user_id 
    FROM operational_costs 
    WHERE status = 'aktif' 
    LIMIT 1
)
SELECT 
    'Dashboard Summary Test' as test_name,
    tu.user_id,
    ds.total_operational_costs,
    ds.current_month_opex,
    ds.business_health_score,
    ds.biggest_expense
FROM test_user tu
CROSS JOIN get_comprehensive_dashboard_summary(tu.user_id) ds;

-- =====================================
-- 7. INVESTIGASI MASALAH SPESIFIK
-- =====================================

-- Cek apakah ada perbedaan case sensitivity pada kolom group
WITH test_user AS (
    SELECT user_id 
    FROM operational_costs 
    WHERE status = 'aktif' 
    LIMIT 1
)
SELECT 
    'Case Sensitivity Test' as test_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN "group" = 'OPERASIONAL' THEN 1 END) as exact_match_operasional,
    COUNT(CASE WHEN "group" = 'operasional' THEN 1 END) as lowercase_operasional,
    COUNT(CASE WHEN "group" ILIKE 'operasional' THEN 1 END) as ilike_operasional,
    COUNT(CASE WHEN "group" ILIKE '%operasional%' THEN 1 END) as ilike_contains_operasional,
    STRING_AGG(DISTINCT "group", ', ') as all_group_values
FROM test_user tu
JOIN operational_costs oc ON oc.user_id = tu.user_id
WHERE oc.status = 'aktif';

-- =====================================
-- 8. SOLUSI CEPAT JIKA DITEMUKAN MASALAH
-- =====================================

-- Jika kolom group kosong atau NULL, perbaiki:
-- UPDATE operational_costs 
-- SET "group" = 'OPERASIONAL'
-- WHERE "group" IS NULL OR TRIM("group") = '' OR "group" = '';

-- Jika semua group value tidak cocok pattern, update ke value yang benar:
-- UPDATE operational_costs 
-- SET "group" = 'OPERASIONAL'  
-- WHERE "group" NOT ILIKE '%operasional%' AND "group" NOT ILIKE '%hpp%';

-- =====================================
-- 9. VERIFIKASI SETELAH PERBAIKAN
-- =====================================

-- Run ulang fungsi setelah perbaikan
-- WITH test_user AS (
--     SELECT user_id 
--     FROM operational_costs 
--     WHERE status = 'aktif' 
--     LIMIT 1
-- )
-- SELECT * FROM get_operational_costs_allocated(
--     (SELECT user_id FROM test_user)
-- );
