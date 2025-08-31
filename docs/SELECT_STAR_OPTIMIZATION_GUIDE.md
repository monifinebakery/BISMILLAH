# SELECT * Optimization Guide

## ❌ Masalah dengan SELECT *

1. **Transfer data berlebihan** - Mengambil kolom yang tidak diperlukan
2. **Memory usage tinggi** - Memuat data yang tidak digunakan  
3. **Network bandwidth boros** - Terutama untuk tabel dengan banyak kolom
4. **Breaking changes** - Jika struktur tabel berubah, aplikasi bisa error
5. **Index tidak optimal** - Query optimizer tidak bisa memilih index terbaik

## 🔍 File yang Perlu Diperbaiki

### 1. `orderService.ts` - Lines 74, 136, 180, 198, 235
```typescript
// ❌ SEKARANG
.select('*')

// ✅ SEHARUSNYA
.select(`
  id,
  nomor_pesanan,
  tanggal,
  nama_pelanggan,
  status,
  total_pesanan,
  items,
  created_at,
  updated_at
`)
```

### 2. `useUnlinkedPayments.ts` - Line 55
```typescript
// ❌ SEKARANG
.select('*')

// ✅ SEHARUSNYA  
.select(`
  id,
  user_id,
  order_id,
  email,
  payment_status,
  is_paid,
  pg_reference_id,
  created_at
`)
```

### 3. `appSettingsApi.ts` - Line 37
```typescript
// ❌ SEKARANG
.select('*')

// ✅ SEHARUSNYA
.select(`
  id,
  user_id,
  target_output_monthly,
  overhead_per_pcs,
  operasional_per_pcs,
  created_at,
  updated_at
`)
```

## 🛠️ Pattern untuk Memperbaiki

### 1. Identifikasi Kolom yang Dipakai
```typescript
// Lihat di transformOrderFromDB atau komponen yang menggunakan data
const usedColumns = [
  'id', 'nomor_pesanan', 'tanggal', 
  'nama_pelanggan', 'status', 'total_pesanan'
];
```

### 2. Buat Selective Query
```typescript
// Gunakan template literal untuk readability
const { data, error } = await supabase
  .from('table_name')
  .select(`
    id,
    field1,
    field2,
    field3
  `)
  .eq('user_id', userId);
```

### 3. Join Tables Selective
```typescript
// ❌ BAD
.select('*, foreign_table(*)')

// ✅ GOOD
.select(`
  id,
  name,
  foreign_table:foreign_table_id (
    id,
    specific_field
  )
`)
```

## 📊 Impact Analysis

### Sebelum Optimasi (SELECT *)
- **Orders table**: ~15 kolom × 100 records = 1500 field transfers
- **Payments table**: ~20 kolom × 50 records = 1000 field transfers  
- **Total**: ~2500 unnecessary field transfers per load

### Setelah Optimasi (Selective)
- **Orders**: ~8 kolom × 100 records = 800 field transfers
- **Payments**: ~8 kolom × 50 records = 400 field transfers
- **Penghematan**: ~68% reduction in data transfer

## 🎯 Priority Files untuk Diperbaiki

1. **HIGH PRIORITY**
   - `orderService.ts` (dipakai sering)
   - `useUnlinkedPayments.ts` (realtime)
   - `profitAnalysisApi.ts` (data besar)

2. **MEDIUM PRIORITY**  
   - `appSettingsApi.ts`
   - `warehouseSyncService.ts`
   - `paymentService.ts`

3. **LOW PRIORITY**
   - Debug files
   - Test files
   - Migration files

## 🔧 Automated Fix Script

Bisa dibuat script untuk auto-replace:

```bash
# Find all SELECT * usage
grep -r "select('\*')" src/ --include="*.ts" --include="*.tsx"

# Replace with template (manual review needed)
sed -i 's/select('\''*'\'')/select(`\n  id,\n  -- TODO: Add specific columns\n`)/g'
```

## 📝 Best Practices

1. **Always specify columns** - Jangan pernah gunakan *
2. **Use meaningful aliases** - untuk joins yang kompleks  
3. **Group related fields** - untuk readability
4. **Comment complex selects** - jelaskan mengapa butuh field tertentu
5. **Regular audit** - review query performance bulanan

## 🚀 Next Steps

1. Identifikasi semua file dengan SELECT *
2. Prioritaskan berdasarkan frequency of use
3. Refactor satu-per-satu dengan testing
4. Monitor performance improvement
5. Set up linting rules untuk prevent future SELECT *
