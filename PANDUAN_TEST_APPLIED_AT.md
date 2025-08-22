# Panduan Lengkap Test Applied_at Fix

## Situasi Saat Ini
✅ Database sudah bersih (tidak ada kolom `applied_at`)  
✅ Cache aplikasi sudah dibersihkan  
✅ Development server sudah restart dengan cache bersih  

## Langkah Testing

### 1. Buka Browser dan Clear Cache
1. Buka http://localhost:5173
2. **PENTING**: Clear browser cache dengan cara:
   - **Chrome/Edge**: Ctrl+Shift+R atau F12 → Application → Storage → Clear site data
   - **Firefox**: Ctrl+Shift+R atau F12 → Storage → Clear All
   - **Safari**: Cmd+Option+E

### 2. Login ke Aplikasi
- Login dengan akun yang memiliki data pembelian
- Navigasi ke halaman Purchase Management

### 3. Test Manual - Coba Update Status Purchase
1. Pilih salah satu purchase yang statusnya "pending"
2. Coba ubah status ke "completed"
3. **Lihat console browser** (F12 → Console)

### 4. Test Otomatis - Via Console
Jika manual test masih error, jalankan di console browser:

```javascript
// Test otomatis
await debugAppliedAt.runDiagnostics()

// Atau test langsung
await debugAppliedAt.testPurchaseUpdate()
```

## Expected Results

### ✅ Jika Sudah Fix
- Purchase status berhasil diubah tanpa error
- Console tidak menampilkan error `applied_at`
- Console menampilkan: `🎉 Applied_at fix test PASSED!`

### ❌ Jika Masih Error
- Error muncul: `Error: record "new" has no field "applied_at"`
- Console menampilkan: `🚨 Applied_at fix test FAILED!`

## Troubleshooting Jika Masih Error

### Browser Cache Issue
1. **Hard refresh**: Ctrl+Shift+R (beberapa kali)
2. **Incognito mode**: Buka http://localhost:5173 di incognito
3. **Clear all data**: F12 → Application → Clear site data

### Service Worker Issue
1. F12 → Application → Service Workers
2. Unregister semua service workers
3. Refresh halaman

### Database Trigger Tersembunyi
Jika masih error, mungkin ada trigger tersembunyi:

```javascript
// Jalankan di console browser
await debugAppliedAt.tryDirectFix()
```

## Langkah Terakhir - Manual Database Check

Jika semua masih gagal, cek langsung di Supabase:

```sql
-- Di SQL Editor Supabase, jalankan:

-- 1. Cek struktur tabel
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchases' 
ORDER BY ordinal_position;

-- 2. Cek triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'purchases';

-- 3. Test update langsung
UPDATE purchases 
SET status = status 
WHERE user_id = 'YOUR_USER_ID' 
LIMIT 1;
```

## Report Hasil

Setelah testing, laporkan hasilnya:
- ✅ **Berhasil**: "Status purchase bisa diupdate tanpa error"
- ❌ **Masih error**: "Masih muncul error applied_at" + screenshot console

## Files untuk Reference
- `/src/utils/debugAppliedAt.ts` - Debug utility
- `/src/utils/testAppliedAtFix.ts` - Auto test
- `/src/components/purchase/services/purchaseApi.ts` - API yang error
- `/DEBUG_APPLIED_AT_GUIDE.md` - Guide lengkap