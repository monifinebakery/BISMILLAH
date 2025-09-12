# Order Completion Troubleshooting Guide

## Masalah: Stok Tidak Berkurang Saat Pesanan Diselesaikan

### Gejala
- User melaporkan: "Saya masukkan pesanan tapi stoknya tidak berkurang kak"
- Pesanan berhasil dibuat dan status berubah menjadi "completed"
- Namun stok bahan baku di warehouse tidak berkurang
- Tidak ada error yang terlihat di UI

### Root Cause Analysis

#### 1. Stored Procedure `complete_order_and_deduct_stock`
Stored procedure ini bertanggung jawab untuk:
- ✅ Memvalidasi pesanan dan mengecek stok yang tersedia
- ✅ Mengurangi stok produk secara otomatis
- ✅ Mencatat pemakaian bahan dalam tabel `pemakaian_bahan`
- ✅ Menangani transaksi keuangan dan aktivitas

**Lokasi**: `supabase/migrations/20250909161445_order_workflow_reapply.sql`

#### 2. API Integration
**File**: `src/integrations/supabase/orderApi.ts`
- ✅ Fungsi `completeOrder` memanggil stored procedure dengan benar
- ✅ Error handling sudah proper
- ✅ Response parsing sudah benar

#### 3. Frontend Integration
**File**: `src/components/orders/providers/OrderProvider.tsx`
- ✅ Fungsi `updateOrderStatus` memanggil `orderApi.completeOrder` saat status diubah ke "completed"
- ✅ Validasi dan error handling sudah ada
- ✅ UI update sudah proper

### Troubleshooting Steps

#### Step 1: Verifikasi Database Connection
```sql
-- Test di Supabase SQL Editor
SELECT * FROM public.complete_order_and_deduct_stock('ORDER_ID_HERE');
```

#### Step 2: Check Browser Console
1. Buka Developer Tools (F12)
2. Pergi ke tab Console
3. Lakukan order completion
4. Cari error messages atau failed API calls

#### Step 3: Monitor Network Calls
1. Buka Developer Tools → Network tab
2. Filter by "Fetch/XHR"
3. Lakukan order completion
4. Pastikan ada call ke `complete_order_and_deduct_stock`

#### Step 4: Check Database Logs
1. Masuk ke Supabase Dashboard
2. Pergi ke Logs → Database
3. Cari error messages saat order completion

### Common Issues & Solutions

#### Issue 1: RLS (Row Level Security) Problems
**Symptoms**: API call berhasil tapi tidak ada perubahan data
**Solution**: 
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('orders', 'bahan_baku', 'pemakaian_bahan');
```

#### Issue 2: Missing Recipe Ingredients
**Symptoms**: Error "No ingredients found for order"
**Solution**: Pastikan resep produk sudah dikonfigurasi dengan benar

#### Issue 3: Insufficient Stock
**Symptoms**: Error "Insufficient stock" meskipun stok terlihat cukup
**Solution**: 
```sql
-- Check actual stock vs required
SELECT * FROM public.get_recipe_ingredients_for_order('ORDER_ID_HERE');
```

#### Issue 4: User Permission Issues
**Symptoms**: "Access denied" error
**Solution**: Pastikan user yang login adalah pemilik pesanan

### Prevention Measures

1. **Regular Testing**: Test order completion workflow secara berkala
2. **Monitoring**: Setup alerts untuk failed order completions
3. **Data Validation**: Pastikan resep produk selalu up-to-date
4. **Stock Monitoring**: Regular audit stok vs pemakaian bahan

### Debug Commands

```javascript
// Run di browser console untuk debug
// 1. Check current user
console.log('Current user:', await supabase.auth.getUser());

// 2. Test stored procedure directly
const { data, error } = await supabase.rpc('complete_order_and_deduct_stock', {
  order_id: 'YOUR_ORDER_ID'
});
console.log('Result:', data, 'Error:', error);

// 3. Check order status
const { data: order } = await supabase
  .from('orders')
  .select('*')
  .eq('id', 'YOUR_ORDER_ID')
  .single();
console.log('Order:', order);
```

## Bulk Delete Implementation

### Problem: Inconsistent Bulk Delete Between Modules

Order module sekarang sudah memiliki implementasi bulk delete yang konsisten dengan purchase module:

#### New Implementation Features:
1. **Fallback Logic**: Jika bulk API tidak tersedia, fallback ke individual deletes
2. **Proper Error Handling**: Detailed logging dan user feedback
3. **Progress Tracking**: Real-time feedback untuk operasi bulk
4. **Consistent Interface**: Same pattern dengan purchase module

#### Usage:
```typescript
// Import the new hook
import { useBulkOperations } from '../hooks/useOrderBulk';

// Use in component
const {
  isBulkDeleting,
  handleBulkDelete,
  // ... other methods
} = useBulkOperations({
  updateOrder,
  deleteOrder,
  bulkDeleteOrders, // optional
  selectedItems,
  clearSelection
});
```

### Migration Guide

Untuk menggunakan implementasi baru:

1. **Replace useOrderBulk** dengan **useBulkOperations** di komponen yang memerlukan bulk operations
2. **Pass required props** sesuai interface `UseBulkOperationsProps`
3. **Update handlers** untuk menggunakan method baru

### Backward Compatibility

Hook lama `useOrderBulk` masih tersedia untuk backward compatibility, tapi disarankan untuk migrate ke `useBulkOperations` untuk konsistensi.

---

**Last Updated**: January 2025
**Maintainer**: Development Team