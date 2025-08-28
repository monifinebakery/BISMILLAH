# 📱 Panduan Pengguna - Fitur Offline HPP by Monifine

## 🚀 Apa itu Mode Offline?

Mode offline memungkinkan Anda menggunakan aplikasi HPP by Monifine bahkan ketika tidak ada koneksi internet. Anda dapat:
- ✅ Menghitung HPP resep
- ✅ Membuat draft pesanan
- ✅ Melihat data yang tersimpan
- ✅ Menyimpan hasil perhitungan
- ✅ Otomatis sinkronisasi saat online kembali

## 📲 Cara Install Aplikasi (PWA)

### 🖥️ **Desktop (Windows/Mac/Linux)**

#### Google Chrome / Microsoft Edge:
1. Buka [preview.monifine.my.id](https://preview.monifine.my.id)
2. Lihat ikon "Install" (🔽) di bagian kanan address bar
3. Klik ikon tersebut atau cari tombol **"Install App"** di header
4. Klik **"Install"** di popup yang muncul
5. Aplikasi akan muncul di desktop Anda

#### Mozilla Firefox:
1. Buka [preview.monifine.my.id](https://preview.monifine.my.id)
2. Klik menu **☰** (tiga garis) di pojok kanan atas
3. Pilih **"Install This Site as an App"**
4. Berikan nama dan klik **"Install"**

### 📱 **Mobile Android**

#### Chrome Android:
1. Buka [preview.monifine.my.id](https://preview.monifine.my.id) di Chrome
2. **Otomatis**: Banner "Add to Home Screen" akan muncul
3. **Manual**: 
   - Masuk ke **Settings** → **Fitur Offline**
   - Ikuti panduan instalasi yang ditampilkan
   - Atau tap **⋮** (titik tiga) → **"Add to Home screen"**
4. Berikan nama dan tap **"Add"**
5. Ikon akan muncul di home screen

#### Samsung Internet:
1. Buka aplikasi di Samsung Internet
2. Tap **⋮** (titik tiga) di bawah
3. Pilih **"Add page to"** → **"Home screen"**

### 🍎 **iPhone/iPad (iOS Safari)**

1. Buka [preview.monifine.my.id](https://preview.monifine.my.id) di Safari
2. Tap tombol **Share** (📤) di bagian bawah
3. Scroll dan pilih **"Add to Home Screen"** 
4. Ubah nama jika perlu, lalu tap **"Add"**
5. Aplikasi akan muncul di home screen

> **💡 Tips**: Aplikasi yang sudah diinstall akan berjalan lebih cepat dan dapat bekerja offline dengan optimal!

## 🎯 Cara Menggunakan Fitur Offline

### 1️⃣ **Mengakses Menu Offline**
- **Sidebar**: Klik **"Fitur Offline"** di menu samping
- **Langsung**: Ketik `/offline` di address bar

### 2️⃣ **Dashboard Offline**
Halaman offline menampilkan:

#### 📊 **Status Penyimpanan**
- **Kapasitas**: Berapa banyak storage yang digunakan
- **Data Tersimpan**: Jumlah item yang disimpan offline
- **Expired Items**: Data yang sudah kadaluarsa

#### 🔄 **Antrian Sinkronisasi**
- **Pending**: Operasi yang menunggu sinkronisasi
- **Berhasil**: Operasi yang sudah tersinkronisasi
- **Gagal**: Operasi yang perlu perhatian

#### 💾 **Data Cache**
- **Resep**: Resep yang tersimpan offline
- **Perhitungan**: History perhitungan HPP
- **Draft Pesanan**: Pesanan yang belum diselesaikan

### 3️⃣ **Kalkulator Offline**

#### Cara Menggunakan:
1. Buka halaman **"Manajemen Resep"** atau **"Kalkulator"**
2. Buat atau pilih resep yang ingin dihitung
3. Masukkan bahan-bahan dan harga
4. Klik **"Hitung HPP"**
5. Hasil otomatis tersimpan di storage offline

#### Fitur Offline Calculator:
- ✅ Perhitungan tetap berjalan tanpa internet
- ✅ History tersimpan lokal
- ✅ Auto-sync saat online kembali
- ✅ Pencarian di history offline

### 4️⃣ **Draft Order System**

#### Membuat Pesanan Offline:
1. Masuk ke halaman **"Pesanan"**
2. Klik **"Tambah Pesanan Baru"**
3. Isi detail customer dan item pesanan
4. Aplikasi otomatis menyimpan sebagai draft setiap 5 detik
5. Status akan berubah jadi **"Draft"** jika offline

#### Auto-Save Features:
- 🔄 **Auto-save** setiap 5 detik
- 💾 **Manual save** dengan Ctrl+S
- 🔔 **Indikator status**: "Tersimpan" / "Menyimpan..." / "Error"

### 5️⃣ **Sinkronisasi Data**

#### Otomatis:
- Saat koneksi internet kembali, aplikasi otomatis sync
- Prioritas: Pesanan → Perhitungan → Data lainnya
- Notifikasi sukses/gagal akan muncul

#### Manual:
1. Masuk ke **"Fitur Offline"**
2. Bagian **"Sync Queue"**
3. Klik **"Sync Now"** untuk paksa sinkronisasi
4. Monitor progress di status bar

## 🔧 Troubleshooting - Mengatasi Masalah

### ❌ **PWA Tidak Bisa Diinstall**

**Penyebab & Solusi:**
- **Masalah SSL**: Pastikan menggunakan `https://preview.monifine.my.id`
- **Cache Penuh**: 
  - Chrome: Settings → Privacy → Clear browsing data
  - Safari: Develop → Empty Caches (atau restart Safari)
- **Browser Tidak Mendukung**: Update browser ke versi terbaru

**Cek Requirements:**
- ✅ HTTPS aktif
- ✅ Valid manifest.json
- ✅ Service Worker terdaftar
- ✅ Ikon tersedia

### 🌐 **Mode Offline Tidak Berfungsi**

**Langkah Diagnosa:**
1. **Buka Developer Tools** (F12)
2. **Tab Application** → **Service Workers**
3. Pastikan status **"Activated and running"**

**Solusi:**
- **Unregister Service Worker** → Refresh halaman
- **Clear Application Data**: Application → Storage → Clear site data
- **Reinstall PWA**: Uninstall → Install ulang

### 🔄 **Sinkronisasi Gagal Terus**

**Penyebab Umum:**
- Koneksi internet tidak stabil
- Server sedang maintenance
- Data corruption di local storage

**Langkah Penyelesaian:**
1. **Cek Koneksi**: Pastikan internet stabil
2. **Manual Retry**: 
   - Fitur Offline → Sync Queue
   - Klik "Retry Failed Items"
3. **Reset Queue**:
   - Clear semua pending items
   - Export data penting dulu
4. **Last Resort**: Clear app data dan sync ulang

### 💾 **Storage Penuh**

**Gejala:**
- Error "Storage quota exceeded"
- Data tidak tersimpan
- Aplikasi lambat

**Solusi:**
1. **Cleanup Otomatis**:
   - Fitur Offline → Storage Status
   - Klik "Cleanup Expired Data"
2. **Manual Cleanup**:
   - Hapus perhitungan lama
   - Hapus draft yang tidak terpakai
   - Clear cache data
3. **Increase Storage**: 
   - Chrome Settings → Site Settings → Storage
   - Berikan lebih banyak quota

### 📱 **Masalah di Mobile**

#### iPhone Safari:
- **Cache Issue**: Settings → Safari → Clear History and Website Data
- **PWA Not Starting**: Restart iPhone, buka ulang dari home screen
- **Offline Not Working**: Re-add to home screen

#### Android Chrome:
- **Installation Failed**: Clear Chrome data, coba lagi
- **Sync Issue**: Check background sync permissions
- **Performance**: Restart Chrome, clear memory

## 💡 Tips & Best Practices

### 🚀 **Optimasi Performa**
1. **Install as PWA** untuk performa terbaik
2. **Preload Data** saat online - buka halaman penting
3. **Regular Cleanup** - hapus data lama secara berkala
4. **Monitor Storage** - cek usage di dashboard offline

### 🔐 **Keamanan Data**
1. **Backup Regular** - export data penting
2. **Don't Store Sensitive Data** - password, payment info
3. **Logout When Done** - terutama di device publik
4. **Update Browser** - untuk security patches terbaru

### 📊 **Manajemen Data Offline**
1. **Prioritas Sync**: Pesanan > Perhitungan > Cache data
2. **Cleanup Schedule**: Weekly cleanup untuk performa optimal  
3. **Backup Before Update**: Export data sebelum update aplikasi
4. **Monitor Quota**: Jangan sampai storage penuh

### 🔄 **Workflow Offline-First**
1. **Work Offline**: Biasakan bekerja tanpa mengandalkan internet
2. **Batch Operations**: Kumpulkan operasi, sync sekaligus
3. **Draft Everything**: Gunakan draft system untuk semua input
4. **Verify Sync**: Selalu cek status sinkronisasi setelah online

## 📞 Bantuan & Dukungan

### 🆘 **Butuh Bantuan Lebih?**

**Kontak Support:**
- 📧 **Email**: support@monifine.my.id
- 📱 **WhatsApp**: +62-xxx-xxxx-xxxx
- 💬 **Live Chat**: Available di aplikasi (pojok kanan bawah)

**Sebelum Menghubungi Support:**
1. Screenshot error message
2. Catat langkah yang menyebabkan masalah
3. Informasi browser dan device
4. Coba solusi di troubleshooting guide ini dulu

### 🐛 **Melaporkan Bug**
Jika menemukan bug atau error:
1. **Reproduction Steps**: Langkah untuk reproduce masalah
2. **Expected vs Actual**: Apa yang diharapkan vs yang terjadi
3. **Environment**: Browser, OS, device type
4. **Screenshots**: Jika memungkinkan

**Kirim ke:**
- GitHub Issues (untuk developer)
- Email support (untuk user umum)

---

## 🎉 Selamat Menggunakan!

Dengan fitur offline ini, bisnis kuliner Anda dapat terus berjalan kapanpun dan dimanapun, bahkan tanpa koneksi internet. 

**Happy Calculating! 🧮✨**

---

*Panduan ini akan diupdate seiring dengan fitur-fitur baru. Pastikan selalu menggunakan versi aplikasi terbaru untuk pengalaman terbaik.*
