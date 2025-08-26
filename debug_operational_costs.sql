-- =====================================
-- DEBUG QUERIES UNTUK OPERATIONAL COSTS
-- Gunakan query ini untuk mendiagnosis masalah biaya operasional = 0
-- =====================================

-- 1. CEK DATA DASAR DI TABEL OPERATIONAL_COSTS
-- Ganti 'your-user-id' dengan UUID user Anda yang sebenarnya
SELECT 
  'Total Records' as info,
  COUNT(*) as count,
  SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif_count,
  SUM(CASE WHEN status = 'nonaktif' THEN 1 ELSE 0 END) as nonaktif_count
FROM operational_costs 
WHERE user_id = 'your-user-id';

-- 2. CEK DATA DETAIL BIAYA OPERASIONAL AKTIF
SELECT 
  nama_biaya,
  jumlah_per_bulan,
  jenis,
  status,
  "group",
  cost_category,
  created_at,
  updated_at
FROM operational_costs 
WHERE user_id = 'your-user-id'
  AND status = 'aktif'
ORDER BY jumlah_per_bulan DESC;

-- 3. CEK AGGREGASI MANUAL SEPERTI DI FUNGSI
SELECT 
  'Manual Aggregation' as test_type,
  COALESCE(SUM(jumlah_per_bulan), 0) as total_monthly,
  COALESCE(SUM(CASE WHEN jenis = 'tetap' THEN jumlah_per_bulan ELSE 0 END), 0) as fixed_costs,
  COALESCE(SUM(CASE WHEN jenis = 'variabel' THEN jumlah_per_bulan ELSE 0 END), 0) as variable_costs,
  COALESCE(SUM(CASE WHEN "group" ILIKE '%hpp%' THEN jumlah_per_bulan ELSE 0 END), 0) as hpp_costs,
  COALESCE(SUM(CASE WHEN "group" ILIKE '%operasional%' THEN jumlah_per_bulan ELSE 0 END), 0) as operational_costs_only
FROM operational_costs
WHERE user_id = 'your-user-id'
  AND status = 'aktif';

-- 4. CEK NILAI GROUP YANG ADA
SELECT 
  "group",
  COUNT(*) as count,
  SUM(jumlah_per_bulan) as total_per_group
FROM operational_costs
WHERE user_id = 'your-user-id'
  AND status = 'aktif'
GROUP BY "group";

-- 5. TEST FUNGSI get_operational_costs_allocated LANGSUNG
-- Ganti 'your-user-id' dengan UUID user Anda
SELECT * FROM get_operational_costs_allocated('your-user-id'::uuid);

-- 6. TEST FUNGSI get_comprehensive_dashboard_summary
-- Ganti 'your-user-id' dengan UUID user Anda  
SELECT 
  total_operational_costs,
  current_month_opex,
  business_health_score
FROM get_comprehensive_dashboard_summary('your-user-id'::uuid);

-- 7. CEK APAKAH ADA MASALAH DENGAN KOLOM GROUP
-- Kadang nilai NULL atau spasi bisa menyebabkan masalah
SELECT 
  nama_biaya,
  jenis,
  status,
  "group" as group_value,
  CASE WHEN "group" IS NULL THEN 'NULL' 
       WHEN "group" = '' THEN 'EMPTY STRING'
       WHEN LENGTH(TRIM("group")) = 0 THEN 'WHITESPACE'
       ELSE 'OK' END as group_status,
  jumlah_per_bulan
FROM operational_costs
WHERE user_id = 'your-user-id'
  AND status = 'aktif';

-- 8. CEK TIPE DATA DAN FORMAT
SELECT 
  nama_biaya,
  jumlah_per_bulan,
  pg_typeof(jumlah_per_bulan) as data_type,
  jenis,
  status,
  "group"
FROM operational_costs
WHERE user_id = 'your-user-id'
  AND status = 'aktif'
LIMIT 5;

-- =====================================
-- SOLUSI POTENSIAL
-- =====================================

-- SOLUSI 1: UPDATE KOLOM GROUP JIKA NULL ATAU KOSONG
-- Jalankan ini jika ada data dengan group NULL/kosong
UPDATE operational_costs 
SET "group" = 'OPERASIONAL'
WHERE user_id = 'your-user-id'
  AND ("group" IS NULL OR TRIM("group") = '');

-- SOLUSI 2: PASTIKAN JUMLAH_PER_BULAN TIDAK NULL/0
-- Cek apakah ada data dengan nilai 0 atau NULL
SELECT 
  COUNT(*) as zero_or_null_count
FROM operational_costs
WHERE user_id = 'your-user-id'
  AND status = 'aktif'
  AND (jumlah_per_bulan IS NULL OR jumlah_per_bulan = 0);

-- SOLUSI 3: INSERT DATA CONTOH JIKA TIDAK ADA DATA
-- Uncomment dan jalankan jika memang tidak ada data sama sekali
/*
INSERT INTO operational_costs (
  user_id, 
  nama_biaya, 
  jumlah_per_bulan, 
  jenis, 
  status, 
  "group",
  created_at,
  updated_at
) VALUES 
  ('your-user-id', 'Gaji Karyawan', 5000000, 'tetap', 'aktif', 'OPERASIONAL', NOW(), NOW()),
  ('your-user-id', 'Sewa Tempat', 2000000, 'tetap', 'aktif', 'OPERASIONAL', NOW(), NOW()),
  ('your-user-id', 'Listrik', 800000, 'variabel', 'aktif', 'OPERASIONAL', NOW(), NOW());
*/

-- =====================================
-- CARA MENGGUNAKAN:
-- =====================================

-- 1. Ganti 'your-user-id' dengan UUID user Anda yang sebenarnya
--    Anda bisa mendapatkan user_id dari:
--    SELECT auth.uid() as user_id;  -- jika menggunakan Supabase Auth

-- 2. Jalankan query 1-8 secara berurutan untuk diagnosis

-- 3. Jika query #3 menunjukkan semua nilai 0, berarti:
--    a) Tidak ada data dengan status 'aktif', ATAU
--    b) Semua jumlah_per_bulan = 0, ATAU  
--    c) Ada masalah dengan kolom 'group'

-- 4. Gunakan solusi yang sesuai berdasarkan hasil diagnosis

-- =====================================
-- EXPECTED RESULTS:
-- =====================================

-- Jika semuanya normal, query #3 harus menunjukkan:
-- total_monthly > 0
-- fixed_costs > 0 (jika ada biaya tetap)  
-- variable_costs > 0 (jika ada biaya variabel)
-- operational_costs_only > 0 (jika ada biaya grup OPERASIONAL)

-- Dan query #5 harus menunjukkan:
-- total_monthly_costs > 0
-- fixed_costs > 0 
-- operational_costs_only > 0
