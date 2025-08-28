# Query Optimization Guide

## 📊 Mengapa Hindari `select('*')`?

Penggunaan `select('*')` dapat menyebabkan:

1. **Performance Issues**
   - Lebih banyak data yang ditransfer dari database
   - Memory usage yang lebih tinggi
   - Network latency yang meningkat
   - Parsing overhead untuk kolom yang tidak digunakan

2. **Maintenance Issues**
   - Perubahan schema bisa break aplikasi
   - Sulit tracking kolom mana yang benar-benar digunakan
   - Bundle size yang tidak perlu membesar

## ✅ Solusi: Specific Field Selection

### 1. Gunakan Utility Functions

```typescript
import { SELECT_FIELDS, OptimizedQueryBuilder } from '@/utils/queryOptimization';

// ❌ Hindari ini
const { data } = await supabase
  .from('purchases')
  .select('*')
  .eq('user_id', userId);

// ✅ Gunakan ini
const { data } = await supabase
  .from('purchases')
  .select(SELECT_FIELDS.purchases.list)
  .eq('user_id', userId);

// ✅ Atau gunakan query builder
const listFields = OptimizedQueryBuilder.getListFields('purchases');
const { data } = await supabase
  .from('purchases')
  .select(listFields)
  .eq('user_id', userId);
```

### 2. Pilih Field Sesuai Kebutuhan

```typescript
// Untuk list view - hanya data yang ditampilkan
SELECT_FIELDS.purchases.list
// 'id, user_id, supplier, tanggal, total_nilai, status, created_at'

// Untuk detail view - semua data yang diperlukan
SELECT_FIELDS.purchases.full
// 'id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at'

// Untuk dropdown/reference - data minimal
SELECT_FIELDS.purchases.minimal
// 'id, supplier, tanggal, total_nilai, status'
```

### 3. Query Performance Tracking

```typescript
import { QueryPerformanceTracker } from '@/utils/queryOptimization';

const fetchPurchases = async (userId: string) => {
  const start = performance.now();
  
  const { data, error } = await supabase
    .from('purchases')
    .select(SELECT_FIELDS.purchases.list)
    .eq('user_id', userId);
  
  const end = performance.now();
  QueryPerformanceTracker.trackQuery('purchases:fetchAll', end - start);
  
  return data;
};

// Check for slow queries
QueryPerformanceTracker.logSlowQueries();
```

## 📋 Optimasi yang Sudah Diterapkan

### 1. DeviceContext.tsx
- **Before**: `select('*')` untuk semua queries
- **After**: Field-specific selections:
  - Register device: `'id, device_id, device_name, last_active'`
  - Fetch devices: `'id, device_id, device_type, os, browser, device_name, ip_address, last_active, is_current, created_at'`
  - Cleanup: `'id, last_active'`

### 2. PurchaseContext.tsx  
- **Before**: `select('*')` untuk purchases
- **After**: `'id, user_id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at'`

### 3. NotificationApi.ts
- **Before**: `select('*')` untuk notifications dan settings
- **After**: 
  - Notifications: `'id, user_id, title, message, type, icon, priority, related_type, related_id, action_url, is_read, is_archived, expires_at, created_at, updated_at'`
  - Settings: `'user_id, push_notifications, inventory_alerts, order_alerts, financial_alerts, created_at, updated_at'`

## 🎯 Best Practices

### 1. Gunakan Field Sets yang Konsisten

```typescript
// ❌ Jangan random select fields
const { data } = await supabase
  .from('purchases')
  .select('id, supplier, tanggal'); // Inconsistent

// ✅ Gunakan predefined field sets
const { data } = await supabase
  .from('purchases')  
  .select(SELECT_FIELDS.purchases.minimal);
```

### 2. Sesuaikan dengan Use Case

```typescript
// List view - minimal data untuk performa
const { data: purchasesList } = await supabase
  .from('purchases')
  .select(SELECT_FIELDS.purchases.list)
  .limit(20);

// Detail view - full data untuk editing
const { data: purchaseDetail } = await supabase
  .from('purchases')
  .select(SELECT_FIELDS.purchases.full)
  .eq('id', purchaseId)
  .single();

// Dropdown - hanya nama dan ID
const { data: purchaseOptions } = await supabase
  .from('purchases')
  .select(SELECT_FIELDS.purchases.minimal);
```

### 3. Count Queries

```typescript
// ❌ Jangan fetch semua data untuk count
const { data } = await supabase
  .from('purchases')
  .select('*')
  .eq('user_id', userId);
const count = data?.length || 0;

// ✅ Gunakan count dengan head-only
const { count } = await supabase
  .from('purchases')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId);
```

### 4. Pagination

```typescript
// ✅ Efficient pagination
const { data, count } = await supabase
  .from('purchases')
  .select(SELECT_FIELDS.purchases.list, { count: 'exact' })
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(0, 19); // First 20 items
```

## 🔧 Utility Functions

### SELECT_FIELDS

Predefined field sets untuk berbagai use case:
- `minimal`: Field minimum untuk reference/dropdown
- `list`: Field untuk list view
- `full`: Field lengkap untuk detail/edit

### OptimizedQueryBuilder

Helper class untuk build query:
- `getListFields(table)`: Get field set untuk list
- `getFullFields(table)`: Get field set untuk detail  
- `getCountFields(table)`: Get field set untuk count

### QueryPerformanceTracker

Monitor query performance:
- `trackQuery(name, time)`: Track execution time
- `getMetrics()`: Get performance metrics
- `logSlowQueries()`: Log queries > 1000ms

## 📈 Expected Performance Impact

Dengan optimasi ini, kamu bisa expect:

- **20-50% reduction** dalam data transfer size
- **10-30% improvement** dalam query response time
- **Reduced memory usage** di client-side
- **Better scalability** saat data bertambah

## 🧪 Testing

Untuk verify optimasi:

```typescript
// Before optimization
console.time('query-before');
const resultBefore = await supabase.from('table').select('*');
console.timeEnd('query-before');

// After optimization  
console.time('query-after');
const resultAfter = await supabase.from('table').select(SELECT_FIELDS.table.list);
console.timeEnd('query-after');
```

## 🚨 Migration Checklist

Saat mengganti `select('*')`:

1. ✅ Identify all fields yang benar-benar digunakan
2. ✅ Test functionality tidak break
3. ✅ Update transformer functions jika perlu
4. ✅ Add performance tracking
5. ✅ Document field selection rationale

## 📚 Resources

- [Supabase Performance Guide](https://supabase.com/docs/guides/database/performance)
- [PostgREST Performance](https://postgrest.org/en/stable/how-tos/performance-tuning.html)
- [Database Query Optimization](https://use-the-index-luke.com/)
