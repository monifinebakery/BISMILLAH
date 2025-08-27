# Panduan Test Bulk Operations & Financial Sync

## Masalah yang Diteliti
Bulk operations (edit massal) tidak membuat financial transactions secara otomatis saat status purchase berubah menjadi "completed", padahal individual status change sudah berfungsi dengan baik.

## Perubahan yang Telah Dibuat

### 1. Modifikasi `useBulkOperations.ts`
- ✅ Menambahkan parameter `setStatus` ke hook
- ✅ Menggunakan `setStatus` khusus untuk status-only updates
- ✅ Menambahkan detailed debugging logs
- ✅ Logic: Jika hanya status yang berubah → gunakan `setStatus`, jika mixed updates → gunakan `updatePurchase`

### 2. Modifikasi `PurchaseTable.tsx`
- ✅ Menambahkan `setStatus` ke parameter `useBulkOperations`
- ✅ Menambahkan debugging logs untuk memastikan function availability

### 3. Implementasi Financial Sync di `PurchaseContext.tsx`
- ✅ `setStatus` function sudah memiliki logic untuk membuat financial transaction
- ✅ Saat status berubah dari non-completed → completed: buat expense transaction
- ✅ Saat status berubah dari completed → non-completed: hapus related transactions

## Cara Testing

### Step 1: Preparation
1. Buka browser dan navigasi ke `/pembelian`
2. Pastikan ada beberapa purchase dengan status "Pending" atau "Dikonfirmasi"
3. Buka Developer Tools (F12) → Console tab

### Step 2: Load Test Script
1. Copy isi file `bulk-operations-test.js`
2. Paste di browser console
3. Press Enter untuk menjalankan
4. Script akan setup monitoring untuk capture logs

### Step 3: Perform Bulk Operation Test
1. **Select Purchases**: Pilih 2-3 purchase dengan status non-completed
2. **Open Bulk Edit**: Klik tombol "Edit Terpilih"
3. **Change Status**: Ubah status ke "Selesai"
4. **Submit**: Konfirmasi perubahan
5. **Watch Console**: Perhatikan console logs yang muncul

### Step 4: Verify Results
Setelah bulk operation, check console untuk logs ini:

**Expected Logs (SUCCESS):**
```
📊 [BULK DEBUG] Using setStatus for purchase [ID] with status: completed
💰 Creating financial transaction for completed purchase
✅ Status mutation onSuccess with: [purchase data]
```

**Problematic Logs (ISSUE):**
```
🔄 [BULK DEBUG] Using updatePurchase for purchase [ID] (mixed updates)
```

### Step 5: Verify Financial Reports
1. Navigate ke `/financial` atau financial reports
2. Check kategori "Pembelian Bahan Baku"
3. Verify new expense transactions created for completed purchases
4. Amounts should match purchase total values

## Expected Behavior

### Individual Status Change (Already Working)
- User changes single purchase status to "completed"
- `setStatus` function called
- Financial transaction created automatically
- ✅ This works correctly

### Bulk Status Change (Fixed)
- User selects multiple purchases
- Changes status to "completed" via bulk edit
- `useBulkOperations` detects status-only change
- Calls `setStatus` for each purchase (not `updatePurchase`)
- Financial transactions created for each purchase
- ✅ This should now work

## Debugging Tips

### If Bulk Operations Don't Use setStatus:
1. Check console for: `"📊 [PURCHASE TABLE DEBUG] setStatus function: true"`
2. Verify `setStatus` is passed to `useBulkOperations` in `PurchaseTable.tsx`
3. Check bulk edit form - make sure only status is being changed

### If No Financial Transactions Created:
1. Check console for financial sync logs: `"💰 Creating financial transaction"`
2. Verify purchase status was actually non-completed before change
3. Check `PurchaseContext.tsx` setStatus function for financial logic
4. Verify financial context is available and working

### If Mixed Updates Behavior:
- If changing status + other fields (supplier, date, etc.) → uses `updatePurchase`
- If changing ONLY status → uses `setStatus`
- This is expected behavior

## Test Cases

### Test Case 1: Status Only Change
1. Select purchases with status "Pending"
2. Bulk edit → Change only status to "Selesai"
3. Expected: Uses `setStatus`, creates financial transactions

### Test Case 2: Mixed Changes
1. Select purchases
2. Bulk edit → Change status + supplier/date
3. Expected: Uses `updatePurchase`, no automatic financial sync

### Test Case 3: Already Completed
1. Select purchases with status "Selesai"
2. Bulk edit → Change status to "Pending"
3. Expected: Uses `setStatus`, deletes related financial transactions

## Troubleshooting

### Issue: Console shows "updatePurchase" instead of "setStatus"
**Cause**: Other fields besides status are being included in bulk update
**Solution**: Ensure bulk edit form only changes status field

### Issue: setStatus called but no financial transactions
**Cause**: Purchase may already be completed or financial context issue
**Solution**: Check purchase previous status and financial context availability

### Issue: No debug logs at all
**Cause**: Code not loaded properly or browser cache
**Solution**: Hard refresh (Ctrl+F5), clear cache, restart dev server

## Success Criteria
✅ Console shows: `"Using setStatus for purchase"`  
✅ Console shows: `"Creating financial transaction"`  
✅ New expense transactions appear in financial reports  
✅ Transaction amounts match purchase totals  
✅ Transactions have correct category: "Pembelian Bahan Baku"

## Manual Verification
After running tests, manually check:
1. `/financial` page → Expense transactions increased
2. Kategori "Pembelian Bahan Baku" has new entries
3. Transaction descriptions mention supplier names
4. Total amounts are correct

---

**Note**: If tests still fail, the issue might be:
1. Browser cache (try hard refresh)
2. Code not deployed properly
3. Database-level issues with financial_transactions table
4. User permissions or authentication issues
