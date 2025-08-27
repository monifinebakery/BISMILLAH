# 🔍 Manual Database Check for Financial Transactions

## Langkah-langkah Debug

### 1. **Cek di Browser Console**

Setelah melakukan bulk operations, periksa console browser untuk log:

```
📝 [BULK DEBUG] Prepared updates: { status: "completed" }
📊 [BULK DEBUG] Using setStatus for purchase [ID] with status: completed
💰 Creating financial transaction for completed purchase: { ... }
📈 Invalidating profit analysis cache after purchase completion
💰 Invalidating financial transaction cache after purchase completion
```

### 2. **Cek Database Langsung**

Jika ada akses ke database, jalankan query ini:

```sql
-- Cek financial transactions yang baru dibuat
SELECT 
    id,
    type,
    category, 
    amount,
    description,
    date,
    related_id,
    created_at
FROM financial_transactions 
WHERE category = 'Pembelian Bahan Baku'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- Cek purchase yang statusnya completed
SELECT 
    id,
    status,
    supplier,
    total_nilai,
    tanggal,
    updated_at
FROM purchases 
WHERE status = 'completed'
AND updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC
LIMIT 10;

-- Cek apakah ada relasi yang benar antara purchase dan financial transaction
SELECT 
    p.id as purchase_id,
    p.supplier,
    p.total_nilai,
    p.status,
    ft.id as transaction_id,
    ft.category,
    ft.amount,
    ft.description,
    ft.related_id
FROM purchases p
LEFT JOIN financial_transactions ft ON p.id = ft.related_id
WHERE p.status = 'completed'
AND p.updated_at > NOW() - INTERVAL '1 hour'
ORDER BY p.updated_at DESC;
```

### 3. **Test Step-by-Step Manual**

1. **Open `/pembelian`**
2. **Buat purchase baru dengan status pending**
3. **Catat ID purchase tersebut**
4. **Select purchase tersebut (checkbox)**
5. **Klik "Edit Bulk"**
6. **Ubah status ke "Selesai" ONLY**
7. **Confirm**
8. **Check console logs**
9. **Go to `/financial` → Tab "Fitur UMKM"**
10. **Check apakah muncul di "Pengeluaran Bulan Ini"**

### 4. **Check Financial Component Data**

Tambahkan temporary debug di `UMKMExpenseCategories.tsx`:

```tsx
// Add this in categoryAnalysis useMemo
console.log('🔍 [UMKM DEBUG] All transactions:', transactions);
console.log('🔍 [UMKM DEBUG] Month expenses:', monthExpenses);
console.log('🔍 [UMKM DEBUG] Category totals:', categoryTotals);
console.log('🔍 [UMKM DEBUG] Current month:', currentMonth);
```

### 5. **Possible Issues**

- **Date filtering**: Transaction date mungkin beda bulan
- **Category case-sensitive**: "Pembelian Bahan Baku" vs "pembelian bahan baku" 
- **Transaction type**: Pastikan type = 'expense'
- **Data refresh**: Financial component belum ter-refresh
- **Authentication**: User ID mismatch

### 6. **Quick Fix Test**

Coba buat financial transaction manual di `/financial`:

1. Go to `/financial`
2. Klik "Tambah Transaksi"  
3. Type: "Pengeluaran"
4. Category: "Pembelian Bahan Baku"
5. Amount: 100000
6. Description: "Test manual"
7. Save
8. Check apakah muncul di "Pengeluaran Bulan Ini"

Jika manual transaction muncul tapi bulk tidak, berarti masalah di bulk operations.
Jika manual transaction juga tidak muncul, berarti masalah di filtering/display.

### 7. **Debug Query untuk React Query Cache**

Add di browser console:

```javascript
// Check React Query cache
window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.cache
  ?.getAll()
  ?.filter(query => query.queryKey.includes('financial'))
  ?.map(q => ({ key: q.queryKey, data: q.state.data }));

// Or simpler:
JSON.stringify(window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.cache?.getAll(), null, 2)
```
