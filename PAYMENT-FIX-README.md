# 🔧 Payment Linking Fix

## Masalah
User yang sudah bayar (paid user) tetap muncul popup upgrade karena payment record mereka belum ter-link ke user account (field `user_id` masih `null`).

## Solusi

### 1. **Quick Fix - Perbaiki Logic di Code** ✅
Sudah diperbaiki di `src/hooks/usePaymentStatus.ts`:
- Sekarang menerima both linked dan unlinked payments sebagai valid
- User yang sudah paid tidak akan muncul upgrade popup lagi

### 2. **Permanent Fix - Link Payments to Users**

#### Step 1: Debug Issue
```bash
pnpm run debug:payment
```
Ini akan mengecek:
- Semua payment records
- Payment yang sudah paid tapi belum linked
- Matching dengan user accounts

#### Step 2: Auto-Fix Linking
```bash
pnpm run fix:payment
```
Ini akan:
- Otomatis link unlinked payments ke user yang sesuai
- Menggunakan email matching
- Fallback ke direct database update

#### Step 3: Manual Fix (jika auto-fix gagal)
Jalankan di Supabase SQL Editor:
```sql
-- Cek unlinked payments
SELECT * FROM user_payments 
WHERE is_paid = true 
  AND payment_status = 'settled' 
  AND user_id IS NULL;

-- Link payment ke user
SELECT link_payment_to_user(
  'ORDER_ID_HERE',
  'USER_UUID_HERE', 
  'user@email.com'
);
```

## Environment Variables Needed

Untuk menjalankan fix script, pastikan ada:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # Optional, untuk admin operations
```

## Troubleshooting

### Error: "Missing Supabase credentials"
- Pastikan file `.env` ada dan memiliki credentials yang benar

### Error: "RPC function not found"  
- Jalankan function ini di Supabase SQL Editor:
```sql
-- Copy dari file: supabase-functions/link_payment_to_user.sql
CREATE OR REPLACE FUNCTION link_payment_to_user(...)
```

### Masih muncul upgrade popup setelah fix
1. User perlu refresh browser atau restart app
2. Cek apakah payment benar-benar sudah linked:
   ```sql
   SELECT * FROM user_payments WHERE email = 'user@email.com';
   ```

## Verification

Setelah menjalankan fix, verify dengan:
```bash
pnpm run debug:payment
```

Seharusnya output:
```
✅ No unlinked payments found. All payments are properly linked!
```

## Files Changed

1. **`src/hooks/usePaymentStatus.ts`** - Perbaiki logic payment verification
2. **`debug-payment-issue.js`** - Script untuk debug payment issues
3. **`fix-payment-linking.js`** - Script untuk auto-fix payment linking
4. **`package.json`** - Tambah npm scripts untuk debug dan fix

## Prevention

Untuk prevent issue ini di masa depan:
1. Pastikan webhook payment gateway properly link payments
2. Implementasi auto-linking di payment webhook handler  
3. Monitor unlinked payments secara regular

---

## 🚨 URGENT FIX

Untuk user yang complain sekarang, langsung jalankan:
```bash
pnpm run fix:payment
```

User langsung bisa akses app tanpa upgrade popup! ✅
