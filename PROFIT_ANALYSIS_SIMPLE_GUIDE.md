# Panduan Profit Analysis - Versi Sederhana

## Overview
Panduan ini khusus untuk implementasi profit analysis yang sederhana dengan 3 tabel utama:
- **financial_transactions** - Data transaksi keuangan
- **operational_costs** - Biaya operasional bulanan
- **profit_analysis** - Hasil analisis profit

## 🚀 Cara Setup

### 1. Jalankan Migrasi
```bash
# Via Supabase CLI
supabase db push

# Atau via Dashboard Supabase
# Copy-paste isi file 20250124100000_profit_analysis_only.sql
```

### 2. Setup Data Awal
```sql
-- Jalankan seeder untuk data sample
SELECT seed_profit_sample_data('your-user-id-here');
```

## 📊 Cara Penggunaan

### 1. Input Transaksi Keuangan

#### Tambah Penjualan (Income)
```sql
INSERT INTO financial_transactions (user_id, type, category, amount, description, date)
VALUES 
  ('your-user-id', 'income', 'Penjualan', 500000, 'Penjualan kue coklat', '2025-01-24'),
  ('your-user-id', 'income', 'Penjualan', 300000, 'Penjualan roti', '2025-01-24');
```

#### Tambah Pengeluaran (Expense)
```sql
INSERT INTO financial_transactions (user_id, type, category, amount, description, date)
VALUES 
  ('your-user-id', 'expense', 'Bahan Baku', 150000, 'Beli tepung dan gula', '2025-01-24'),
  ('your-user-id', 'expense', 'Operasional', 50000, 'Bayar listrik', '2025-01-24');
```

### 2. Setup Biaya Operasional
```sql
INSERT INTO operational_costs (user_id, nama_biaya, jumlah_per_bulan, jenis, "group")
VALUES 
  ('your-user-id', 'Sewa Toko', 2500000, 'tetap', 'operasional'),
  ('your-user-id', 'Gaji Karyawan', 2000000, 'tetap', 'operasional'),
  ('your-user-id', 'Listrik & Air', 600000, 'variabel', 'operasional');
```

### 3. Hitung Profit Analysis
```sql
-- Hitung profit untuk periode tertentu
SELECT * FROM calculate_profit_analysis(
  'your-user-id',
  '2025-01-01'::date,
  '2025-01-31'::date
);

-- Hasil akan menampilkan:
-- total_revenue | total_cogs | total_opex | gross_profit | net_profit | gross_margin | net_margin
```

### 4. Simpan Hasil Analisis
```sql
-- Simpan hasil analisis ke tabel profit_analysis
INSERT INTO profit_analysis (
  user_id, period, period_type, 
  total_revenue, total_cogs, total_opex,
  gross_profit, net_profit, gross_margin, net_margin,
  revenue_breakdown, cogs_breakdown
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
  gross_margin,
  net_margin,
  get_revenue_breakdown('your-user-id', '2025-01-01'::date, '2025-01-31'::date),
  get_expense_breakdown('your-user-id', '2025-01-01'::date, '2025-01-31'::date)
FROM calculate_profit_analysis(
  'your-user-id',
  '2025-01-01'::date,
  '2025-01-31'::date
);
```

## 📈 Query Analisis

### 1. Lihat Profit Bulanan
```sql
SELECT 
  period,
  total_revenue,
  total_cogs,
  total_opex,
  net_profit,
  net_margin
FROM profit_analysis 
WHERE user_id = 'your-user-id' 
  AND period_type = 'monthly'
ORDER BY period DESC;
```

### 2. Breakdown Revenue per Kategori
```sql
SELECT 
  category,
  SUM(amount) as total,
  COUNT(*) as jumlah_transaksi
FROM financial_transactions 
WHERE user_id = 'your-user-id' 
  AND type = 'income'
  AND date >= '2025-01-01'
GROUP BY category
ORDER BY total DESC;
```

### 3. Breakdown Expense per Kategori
```sql
SELECT 
  category,
  SUM(amount) as total,
  COUNT(*) as jumlah_transaksi
FROM financial_transactions 
WHERE user_id = 'your-user-id' 
  AND type = 'expense'
  AND date >= '2025-01-01'
GROUP BY category
ORDER BY total DESC;
```

### 4. Trend Harian
```sql
SELECT 
  date,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as daily_revenue,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as daily_expense,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as daily_profit
FROM financial_transactions 
WHERE user_id = 'your-user-id'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

## 🔧 Maintenance

### Update Biaya Operasional
```sql
-- Update biaya yang sudah ada
UPDATE operational_costs 
SET jumlah_per_bulan = 2800000
WHERE user_id = 'your-user-id' 
  AND nama_biaya = 'Sewa Toko';

-- Nonaktifkan biaya yang tidak terpakai
UPDATE operational_costs 
SET status = 'nonaktif'
WHERE user_id = 'your-user-id' 
  AND nama_biaya = 'Biaya Lama';
```

### Hapus Data Lama
```sql
-- Hapus transaksi lebih dari 1 tahun
DELETE FROM financial_transactions 
WHERE user_id = 'your-user-id'
  AND date < CURRENT_DATE - INTERVAL '1 year';
```

## 📱 Integrasi dengan Frontend

### API Calls yang Dibutuhkan
```typescript
// 1. Get profit analysis
const { data } = await supabase
  .rpc('calculate_profit_analysis', {
    p_user_id: userId,
    p_start_date: '2025-01-01',
    p_end_date: '2025-01-31'
  });

// 2. Get revenue breakdown
const { data: revenueBreakdown } = await supabase
  .rpc('get_revenue_breakdown', {
    p_user_id: userId,
    p_start_date: '2025-01-01',
    p_end_date: '2025-01-31'
  });

// 3. Insert financial transaction
const { data, error } = await supabase
  .from('financial_transactions')
  .insert({
    user_id: userId,
    type: 'income',
    category: 'Penjualan',
    amount: 500000,
    description: 'Penjualan hari ini',
    date: '2025-01-24'
  });
```

## 🚨 Troubleshooting

### Error: Function tidak ditemukan
```sql
-- Check apakah function sudah dibuat
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name LIKE '%profit%';
```

### Error: RLS Policy
```sql
-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Data tidak muncul
```sql
-- Pastikan user_id benar
SELECT auth.uid(); -- Untuk mendapatkan user_id saat ini

-- Check data dengan user_id yang benar
SELECT * FROM financial_transactions 
WHERE user_id = auth.uid()
LIMIT 5;
```

## ✅ Checklist Setup

- [ ] Migrasi SQL sudah dijalankan
- [ ] Sample data sudah di-seed
- [ ] Function profit analysis bisa dipanggil
- [ ] RLS policies aktif
- [ ] Data transaksi bisa diinput
- [ ] Biaya operasional sudah disetup
- [ ] Hasil analisis bisa dihitung

---

**Catatan**: Schema ini sudah disederhanakan untuk fokus pada profit analysis. Untuk fitur yang lebih lengkap, gunakan schema yang lebih komprehensif.