# Panduan SQL Supabase untuk Profit Analysis

## Overview
File ini berisi panduan lengkap untuk menggunakan SQL schema profit analysis yang telah dibuat di Supabase. Schema ini dirancang untuk mendukung analisis profit yang komprehensif dengan fitur-fitur canggih.

## 📋 Struktur Database

### Tabel Utama

1. **financial_transactions** - Transaksi keuangan (income/expense)
2. **bahan_baku** - Master data bahan baku dengan WAC support
3. **operational_costs** - Biaya operasional bulanan
4. **app_settings** - Pengaturan global untuk cost allocation
5. **profit_analysis** - Hasil analisis profit per periode
6. **purchases** - Data pembelian bahan baku
7. **suppliers** - Master data supplier
8. **hpp_recipes** - Recipe costing untuk COGS calculation
9. **orders** - Data penjualan/pesanan
10. **activities** - Audit trail dan logging

## 🚀 Cara Menjalankan Migrasi

### 1. Via Supabase CLI
```bash
# Pastikan sudah login ke Supabase
supabase login

# Jalankan migrasi
supabase db push

# Atau reset dan apply semua migrasi
supabase db reset
```

### 2. Via Supabase Dashboard
1. Buka Supabase Dashboard
2. Pilih project Anda
3. Masuk ke SQL Editor
4. Copy-paste isi file `20250124000000_create_profit_analysis_schema.sql`
5. Klik "Run"

## 📊 Contoh Penggunaan

### 1. Setup Data Awal
```sql
-- Jalankan seeder untuk data sample
SELECT seed_profit_analysis_sample_data('your-user-id-here');
```

### 2. Input Data Transaksi Keuangan
```sql
-- Tambah income (penjualan)
INSERT INTO financial_transactions (user_id, type, category, amount, description, date)
VALUES 
  ('your-user-id', 'income', 'Penjualan', 500000, 'Penjualan kue coklat', '2025-01-24'),
  ('your-user-id', 'income', 'Penjualan', 750000, 'Penjualan roti tawar', '2025-01-24');

-- Tambah expense (pengeluaran)
INSERT INTO financial_transactions (user_id, type, category, amount, description, date)
VALUES 
  ('your-user-id', 'expense', 'Bahan Baku', 200000, 'Beli tepung terigu 20kg', '2025-01-24'),
  ('your-user-id', 'expense', 'Operasional', 50000, 'Bayar listrik', '2025-01-24');
```

### 3. Kelola Bahan Baku dengan WAC
```sql
-- Tambah bahan baku baru
INSERT INTO bahan_baku (user_id, nama, kategori, stok, satuan, harga_satuan)
VALUES ('your-user-id', 'Coklat Bubuk', 'Bahan Utama', 5, 'kg', 85000);

-- Update stok dengan WAC calculation
DO $$
DECLARE
  new_wac numeric;
  bahan_id uuid;
BEGIN
  -- Get bahan_baku ID
  SELECT id INTO bahan_id FROM bahan_baku 
  WHERE user_id = 'your-user-id' AND nama = 'Coklat Bubuk';
  
  -- Calculate new WAC
  SELECT calculate_wac_price('your-user-id', bahan_id, 10, 90000) INTO new_wac;
  
  -- Update stock and WAC
  UPDATE bahan_baku 
  SET stok = stok + 10, harga_rata_rata = new_wac
  WHERE id = bahan_id;
END $$;
```

### 4. Setup Biaya Operasional
```sql
-- Tambah biaya operasional
INSERT INTO operational_costs (user_id, nama_biaya, jumlah_per_bulan, jenis, "group")
VALUES 
  ('your-user-id', 'Sewa Toko', 3000000, 'tetap', 'operasional'),
  ('your-user-id', 'Gaji Karyawan', 2500000, 'tetap', 'operasional'),
  ('your-user-id', 'Listrik & Air', 800000, 'variabel', 'operasional'),
  ('your-user-id', 'Packaging', 500000, 'variabel', 'hpp');
```

### 5. Buat Recipe dengan HPP
```sql
-- Tambah recipe baru
INSERT INTO hpp_recipes (user_id, nama_resep, deskripsi, porsi, ingredients, biaya_tenaga_kerja, biaya_overhead)
VALUES (
  'your-user-id',
  'Kue Coklat Premium',
  'Kue coklat dengan topping premium',
  12, -- 12 porsi
  '[
    {"bahan_baku_id": "tepung-id", "qty": 0.5, "satuan": "kg"},
    {"bahan_baku_id": "coklat-id", "qty": 0.2, "satuan": "kg"},
    {"bahan_baku_id": "telur-id", "qty": 6, "satuan": "butir"}
  ]'::jsonb,
  50000, -- biaya tenaga kerja
  25000  -- biaya overhead
);
```

### 6. Analisis Profit Real-time
```sql
-- Get profit analysis untuk periode tertentu
SELECT * FROM calculate_realtime_profit(
  'your-user-id',
  '2025-01-01'::date,
  '2025-01-31'::date
);

-- Hasil akan menampilkan:
-- total_revenue, total_cogs, total_opex, gross_profit, net_profit
```

### 7. Simpan Hasil Analisis
```sql
-- Insert hasil analisis ke tabel profit_analysis
INSERT INTO profit_analysis (
  user_id, period, period_type, 
  total_revenue, total_cogs, total_opex,
  gross_profit, net_profit, gross_margin, net_margin
)
SELECT 
  'your-user-id',
  '2025-01',
  'monthly',
  total_revenue,
  total_cogs,
  total_opex,
  gross_profit,
  net_profit,
  CASE WHEN total_revenue > 0 THEN (gross_profit / total_revenue) * 100 ELSE 0 END,
  CASE WHEN total_revenue > 0 THEN (net_profit / total_revenue) * 100 ELSE 0 END
FROM calculate_realtime_profit(
  'your-user-id',
  '2025-01-01'::date,
  '2025-01-31'::date
);
```

## 📈 Query Analisis Lanjutan

### 1. Trend Profit Bulanan
```sql
SELECT 
  period,
  total_revenue,
  net_profit,
  net_margin,
  LAG(net_profit) OVER (ORDER BY period) as prev_profit,
  CASE 
    WHEN LAG(net_profit) OVER (ORDER BY period) IS NOT NULL 
    THEN ((net_profit - LAG(net_profit) OVER (ORDER BY period)) / LAG(net_profit) OVER (ORDER BY period)) * 100
    ELSE 0 
  END as growth_percentage
FROM profit_analysis 
WHERE user_id = 'your-user-id' 
  AND period_type = 'monthly'
ORDER BY period DESC
LIMIT 12;
```

### 2. Analisis Bahan Baku Termahal
```sql
SELECT 
  nama,
  kategori,
  stok,
  harga_rata_rata,
  (stok * harga_rata_rata) as nilai_stok,
  CASE 
    WHEN stok <= minimum THEN 'KRITIS'
    WHEN stok <= minimum * 1.5 THEN 'RENDAH'
    ELSE 'AMAN'
  END as status_stok
FROM bahan_baku 
WHERE user_id = 'your-user-id' 
  AND status = 'aktif'
ORDER BY (stok * harga_rata_rata) DESC;
```

### 3. Breakdown Biaya Operasional
```sql
SELECT 
  "group",
  jenis,
  COUNT(*) as jumlah_item,
  SUM(jumlah_per_bulan) as total_biaya,
  AVG(jumlah_per_bulan) as rata_rata_biaya
FROM operational_costs 
WHERE user_id = 'your-user-id' 
  AND status = 'aktif'
GROUP BY "group", jenis
ORDER BY total_biaya DESC;
```

### 4. Performance Recipe Terbaik
```sql
SELECT 
  hr.nama_resep,
  hr.hpp_per_porsi,
  hr.harga_jual,
  hr.margin_keuntungan,
  (hr.harga_jual - hr.hpp_per_porsi) as profit_per_porsi,
  CASE 
    WHEN hr.harga_jual > 0 
    THEN ((hr.harga_jual - hr.hpp_per_porsi) / hr.harga_jual) * 100 
    ELSE 0 
  END as margin_percentage
FROM hpp_recipes hr
WHERE hr.user_id = 'your-user-id'
ORDER BY margin_percentage DESC;
```

## 🔧 Maintenance & Optimization

### 1. Update WAC untuk Semua Bahan Baku
```sql
-- Function untuk recalculate WAC berdasarkan purchase history
CREATE OR REPLACE FUNCTION recalculate_all_wac(p_user_id uuid)
RETURNS void AS $$
DECLARE
  bahan_record RECORD;
BEGIN
  FOR bahan_record IN 
    SELECT id, nama FROM bahan_baku WHERE user_id = p_user_id
  LOOP
    -- Logic untuk recalculate WAC berdasarkan purchase history
    -- Implementasi sesuai kebutuhan bisnis
    RAISE NOTICE 'Recalculating WAC for: %', bahan_record.nama;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 2. Cleanup Data Lama
```sql
-- Hapus activities yang lebih dari 1 tahun
DELETE FROM activities 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Archive profit analysis data lama
-- (Implementasi sesuai kebutuhan)
```

### 3. Backup Data Penting
```sql
-- Export profit analysis data
COPY (
  SELECT * FROM profit_analysis 
  WHERE user_id = 'your-user-id'
) TO '/path/to/backup/profit_analysis_backup.csv' WITH CSV HEADER;
```

## 🚨 Troubleshooting

### Error: RLS Policy
Jika ada error terkait Row Level Security:
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Disable RLS sementara untuk debugging (HATI-HATI!)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Error: Function Not Found
```sql
-- Check available functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### Performance Issues
```sql
-- Check index usage
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan, 
  idx_tup_read, 
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## 📝 Best Practices

1. **Selalu gunakan user_id** dalam setiap query untuk RLS
2. **Backup data** secara berkala
3. **Monitor performance** dengan pg_stat_statements
4. **Validasi data** sebelum insert/update
5. **Gunakan transaction** untuk operasi kompleks
6. **Update WAC** secara konsisten setiap ada pembelian
7. **Review profit analysis** secara berkala

## 🔗 Integrasi dengan Frontend

Untuk integrasi dengan aplikasi React/TypeScript yang sudah ada:

1. **Update API types** sesuai dengan schema baru
2. **Modify existing hooks** untuk menggunakan tabel baru
3. **Update components** untuk menampilkan data yang lebih lengkap
4. **Add validation** sesuai dengan constraint database

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Check dokumentasi Supabase
2. Review error logs di Supabase Dashboard
3. Test query di SQL Editor terlebih dahulu
4. Pastikan RLS policies sudah benar

---

**Catatan**: Schema ini dirancang untuk mendukung analisis profit yang komprehensif. Sesuaikan dengan kebutuhan bisnis spesifik Anda.