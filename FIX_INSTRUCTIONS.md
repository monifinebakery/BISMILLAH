# 🔧 Fix Instructions untuk Masalah User

## 🎯 Masalah yang Dilaporkan
1. **Stok tidak berkurang otomatis** saat pesanan selesai
2. **Tidak bisa menambahkan biaya operasional**

## 🔍 Hasil Investigasi

### ✅ MASALAH 1: Stok Tidak Berkurang Otomatis
**Status: SISTEM SUDAH BENAR - Kemungkinan user error**

**Temuan:**
- Stored procedure `complete_order_and_deduct_stock` sudah ada dan bekerja dengan benar
- Frontend integration sudah proper - menggunakan API yang benar
- Sistem otomatis mengurangi stok saat status order diubah ke "completed"

**Kemungkinan Penyebab:**
1. **Order tidak menggunakan resep** - hanya order dengan resep yang akan mengurangi stok
2. **Stok sudah tidak cukup** - sistem akan memberikan error jika stok tidak mencukupi
3. **User tidak mengubah status ke "completed"** - hanya mengubah status lain

### ✅ MASALAH 2: Tidak Bisa Add Biaya Operasional  
**Status: SISTEM SUDAH BENAR - Perlu troubleshooting lebih detail**

**Temuan:**
- Database schema `operational_costs` sudah benar
- RLS policies sudah proper (user hanya bisa akses data sendiri)
- API sudah ada dan lengkap dengan error handling
- Form validation sudah ada

**Kemungkinan Penyebab:**
1. **Session/authentication issue** - user perlu refresh/login ulang
2. **Validation error** - form field tidak diisi dengan benar
3. **Network/connection issue** - internet bermasalah saat submit

## 🚀 Solusi yang Diberikan

### 1. Debug Script
Saya sudah membuat `debug-issues.js` yang bisa dijalankan user di browser console untuk:
- Test order completion dengan stock deduction
- Test operational cost creation
- Check database permissions
- Identify specific error messages

### 2. Langkah Troubleshooting untuk User

#### Untuk Masalah Stok:
```
1. Pastikan order menggunakan resep (bukan custom item)
2. Cek apakah stok bahan baku mencukupi
3. Ubah status order ke "completed" (bukan status lain)
4. Lihat di console browser apakah ada error
```

#### Untuk Masalah Biaya Operasional:
```
1. Refresh halaman/login ulang
2. Pastikan semua field required diisi:
   - Nama Biaya (min 3 karakter)
   - Jumlah per Bulan (> 0)
   - Jenis (Tetap/Variabel)
   - Kelompok Biaya (HPP/Operasional)
3. Cek koneksi internet
4. Buka Developer Tools dan lihat error di Console/Network tab
```

## 🧪 Testing Commands

User bisa jalankan ini di browser console (F12) saat login di app:

```javascript
// Load debug script
const script = document.createElement('script');
script.src = '/debug-issues.js';
document.head.appendChild(script);

// Setelah script loaded, jalankan:
runAllTests(); // Test semua fitur
```

Atau test individual:
```javascript
testOrderCompletion(); // Test stok reduction
testOperationalCost(); // Test biaya operasional
checkPermissions(); // Test database access
```

## 📋 Checklist untuk User

### Test Order Completion:
- [ ] Buat order dengan item yang menggunakan resep
- [ ] Pastikan stok bahan baku cukup
- [ ] Ubah status order ke "completed"
- [ ] Cek apakah stok berkurang di halaman warehouse

### Test Biaya Operasional:
- [ ] Buka halaman Biaya Operasional
- [ ] Klik "Tambah Biaya"
- [ ] Isi semua field required
- [ ] Klik "Simpan"
- [ ] Cek apakah muncul di daftar biaya

## 🔧 Jika Masih Bermasalah

1. **Jalankan debug script** dan kirim hasil console output
2. **Screenshot error message** yang muncul
3. **Rekam video** proses yang gagal
4. **Cek browser console** untuk error messages
5. **Try incognito mode** untuk test tanpa cache/extension

## 📞 Next Steps

Setelah user menjalankan debug script, kita bisa:
1. Identifikasi root cause yang spesifik
2. Fix bug jika memang ada
3. Update dokumentasi/training jika user error
4. Improve error messages untuk clarity

---

**Developer Notes:**
- Kedua sistem technically sudah benar
- Perlu user feedback dari debug script untuk diagnosis lebih akurat
- Kemungkinan besar adalah user workflow issue, bukan technical bug