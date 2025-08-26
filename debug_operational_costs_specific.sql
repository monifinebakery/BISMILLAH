-- =====================================
-- DEBUG OPERATIONAL COSTS - BERDASARKAN SCHEMA AKTUAL
-- =====================================

-- Schema Analysis:
-- - Kolom "group" memiliki default 'OPERASIONAL' dan constraint hanya 'HPP' atau 'OPERASIONAL'  
-- - Kolom status default 'aktif' dengan constraint 'aktif' atau 'nonaktif'
-- - Kolom jumlah_per_bulan memiliki constraint >= 0

-- =====================================
-- STEP 1: DAPATKAN USER ID YANG BENAR
-- =====================================

-- Jika menggunakan Supabase Auth/RLS
SELECT auth.uid() as current_user_id;

-- Atau ambil user_id yang ada data
SELECT DISTINCT user_id, COUNT(*) as record_count
FROM operational_costs 
GROUP BY user_id
ORDER BY record_count DESC;

-- =====================================
-- STEP 2: DIAGNOSIS LENGKAP DENGAN USER ID SPESIFIK
-- Ganti 'your-user-id' dengan UUID user yang sebenarnya
-- =====================================

-- 2a. Overview data per user
SELECT 
  user_id,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'aktif' THEN 1 END) as aktif_count,
  COUNT(CASE WHEN status = 'nonaktif' THEN 1 END) as nonaktif_count,
  SUM(CASE WHEN status = 'aktif' THEN jumlah_per_bulan ELSE 0 END) as total_aktif_amount,
  COUNT(CASE WHEN "group" = 'OPERASIONAL' THEN 1 END) as operasional_count,
  COUNT(CASE WHEN "group" = 'HPP' THEN 1 END) as hpp_count
FROM operational_costs 
WHERE user_id = 'your-user-id'::uuid
GROUP BY user_id;

-- 2b. Detail data aktif
SELECT 
  id,
  nama_biaya,
  jenis,
  jumlah_per_bulan,
  status,
  "group",
  cost_category,
  created_at,
  effective_date
FROM operational_costs 
WHERE user_id = 'your-user-id'::uuid
  AND status = 'aktif'
ORDER BY jumlah_per_bulan DESC;

-- 2c. Analisis group distribution
SELECT 
  "group",
  jenis,
  COUNT(*) as count,
  SUM(jumlah_per_bulan) as total_amount,
  AVG(jumlah_per_bulan) as avg_amount
FROM operational_costs
WHERE user_id = 'your-user-id'::uuid
  AND status = 'aktif'
GROUP BY "group", jenis
ORDER BY "group", jenis;

-- =====================================
-- STEP 3: TEST MANUAL AGGREGATION (SAMA SEPERTI FUNGSI)
-- =====================================

SELECT 
  'Manual Test Aggregation' as test_name,
  -- Sama persis dengan logika di fungsi get_operational_costs_allocated
  COALESCE(SUM(jumlah_per_bulan), 0) as total_monthly,
  COALESCE(SUM(CASE WHEN jenis = 'tetap' THEN jumlah_per_bulan ELSE 0 END), 0) as fixed_costs,
  COALESCE(SUM(CASE WHEN jenis = 'variabel' THEN jumlah_per_bulan ELSE 0 END), 0) as variable_costs,
  COALESCE(SUM(CASE WHEN "group" ILIKE '%hpp%' THEN jumlah_per_bulan ELSE 0 END), 0) as hpp_costs,
  COALESCE(SUM(CASE WHEN "group" ILIKE '%operasional%' THEN jumlah_per_bulan ELSE 0 END), 0) as operational_costs_only
FROM operational_costs
WHERE user_id = 'your-user-id'::uuid
  AND status = 'aktif';

-- =====================================
-- STEP 4: TEST PATTERN MATCHING ISSUES
-- =====================================

-- Cek apakah pattern ILIKE bekerja dengan benar
SELECT 
  nama_biaya,
  "group",
  jumlah_per_bulan,
  -- Test exact match
  CASE WHEN "group" = 'OPERASIONAL' THEN 'EXACT_MATCH_OPS' ELSE 'NO_MATCH' END as exact_ops,
  CASE WHEN "group" = 'HPP' THEN 'EXACT_MATCH_HPP' ELSE 'NO_MATCH' END as exact_hpp,
  -- Test ILIKE pattern (seperti di fungsi)
  CASE WHEN "group" ILIKE '%hpp%' THEN 'ILIKE_HPP' ELSE 'NO_MATCH' END as ilike_hpp,
  CASE WHEN "group" ILIKE '%operasional%' THEN 'ILIKE_OPS' ELSE 'NO_MATCH' END as ilike_ops,
  -- Test case sensitivity
  CASE WHEN LOWER("group") LIKE '%operasional%' THEN 'LOWERCASE_OPS' ELSE 'NO_MATCH' END as lower_ops
FROM operational_costs
WHERE user_id = 'your-user-id'::uuid
  AND status = 'aktif'
ORDER BY jumlah_per_bulan DESC;

-- =====================================
-- STEP 5: TEST FUNGSI DATABASE LANGSUNG
-- =====================================

-- Test get_operational_costs_allocated
SELECT 
  'Function Test Result' as test_name,
  *
FROM get_operational_costs_allocated('your-user-id'::uuid);

-- Test get_comprehensive_dashboard_summary
SELECT 
  'Dashboard Test Result' as test_name,
  total_operational_costs,
  current_month_opex,
  current_month_profit,
  business_health_score
FROM get_comprehensive_dashboard_summary('your-user-id'::uuid);

-- =====================================
-- STEP 6: KEMUNGKINAN MASALAH & SOLUSI
-- =====================================

-- Masalah 1: Tidak ada data aktif
-- Cek berapa banyak data nonaktif
SELECT 
  'Non-active Data Check' as check_name,
  COUNT(*) as nonaktif_count,
  SUM(jumlah_per_bulan) as total_nonaktif_amount
FROM operational_costs
WHERE user_id = 'your-user-id'::uuid
  AND status = 'nonaktif';

-- Masalah 2: Semua jumlah_per_bulan = 0
SELECT 
  'Zero Amount Check' as check_name,
  COUNT(*) as zero_amount_count
FROM operational_costs
WHERE user_id = 'your-user-id'::uuid
  AND status = 'aktif'
  AND jumlah_per_bulan = 0;

-- Masalah 3: Effective date filter (jika ada logic yang belum kelihatan)
SELECT 
  'Effective Date Check' as check_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN effective_date IS NULL THEN 1 END) as null_effective_date,
  COUNT(CASE WHEN effective_date <= CURRENT_DATE THEN 1 END) as valid_effective_date,
  MIN(effective_date) as earliest_date,
  MAX(effective_date) as latest_date
FROM operational_costs
WHERE user_id = 'your-user-id'::uuid
  AND status = 'aktif';

-- =====================================
-- STEP 7: SOLUSI BERDASARKAN TEMUAN
-- =====================================

-- SOLUSI A: Jika tidak ada data sama sekali, insert data contoh
/*
INSERT INTO operational_costs (
  user_id, 
  nama_biaya, 
  jenis, 
  jumlah_per_bulan, 
  status, 
  "group"
) VALUES 
  ('your-user-id'::uuid, 'Gaji Staff Produksi', 'tetap', 4000000, 'aktif', 'HPP'),
  ('your-user-id'::uuid, 'Gaji Admin', 'tetap', 3000000, 'aktif', 'OPERASIONAL'),
  ('your-user-id'::uuid, 'Sewa Tempat', 'tetap', 2500000, 'aktif', 'OPERASIONAL'),
  ('your-user-id'::uuid, 'Listrik & Air', 'variabel', 800000, 'aktif', 'OPERASIONAL'),
  ('your-user-id'::uuid, 'Gas LPG', 'variabel', 300000, 'aktif', 'HPP');
*/

-- SOLUSI B: Jika ada data tapi status nonaktif, aktifkan
/*
UPDATE operational_costs 
SET status = 'aktif',
    updated_at = NOW()
WHERE user_id = 'your-user-id'::uuid
  AND status = 'nonaktif'
  AND jumlah_per_bulan > 0;
*/

-- SOLUSI C: Jika jumlah_per_bulan = 0, update dengan nilai yang masuk akal
/*
UPDATE operational_costs 
SET jumlah_per_bulan = CASE
  WHEN nama_biaya ILIKE '%gaji%' THEN 3000000
  WHEN nama_biaya ILIKE '%sewa%' THEN 2000000  
  WHEN nama_biaya ILIKE '%listrik%' THEN 500000
  ELSE 1000000
END,
updated_at = NOW()
WHERE user_id = 'your-user-id'::uuid
  AND status = 'aktif'
  AND jumlah_per_bulan = 0;
*/

-- =====================================
-- STEP 8: VERIFIKASI SETELAH PERBAIKAN
-- =====================================

-- Setelah menjalankan solusi, test ulang:

-- 8a. Cek data sudah benar
SELECT 
  'Post-Fix Verification' as test_name,
  COUNT(*) as total_aktif,
  SUM(jumlah_per_bulan) as total_amount,
  COUNT(CASE WHEN "group" = 'OPERASIONAL' THEN 1 END) as operasional_count,
  SUM(CASE WHEN "group" = 'OPERASIONAL' THEN jumlah_per_bulan ELSE 0 END) as operasional_total
FROM operational_costs
WHERE user_id = 'your-user-id'::uuid
  AND status = 'aktif';

-- 8b. Test fungsi lagi
SELECT * FROM get_operational_costs_allocated('your-user-id'::uuid);

-- 8c. Test dashboard lagi  
SELECT 
  total_operational_costs,
  current_month_opex
FROM get_comprehensive_dashboard_summary('your-user-id'::uuid);

-- =====================================
-- EXPECTED RESULTS:
-- =====================================

-- Setelah perbaikan, hasil yang diharapkan:
-- - Step 2a: aktif_count > 0, total_aktif_amount > 0
-- - Step 3: operational_costs_only > 0
-- - Step 5: total_monthly_costs > 0, operational_costs_only > 0  
-- - Step 8: total_operational_costs > 0, current_month_opex > 0
