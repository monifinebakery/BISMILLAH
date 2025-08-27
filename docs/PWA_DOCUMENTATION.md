# HPP by Monifine - PWA Documentation

## 📱 Progressive Web App (PWA) Overview

HPP by Monifine adalah aplikasi web progresif yang dapat diinstal dan digunakan seperti aplikasi native. PWA ini menyediakan pengalaman offline yang komprehensif untuk mengelola bisnis kuliner Anda.

## 🌟 Fitur Utama PWA

### ✅ Dapat Diinstal
- **Desktop**: Tombol install di header aplikasi
- **Mobile**: Akses melalui Settings → Fitur Offline untuk panduan instalasi
- **Otomatis**: Browser akan menampilkan prompt instalasi ketika kriteria terpenuhi

### ✅ Bekerja Offline
- Navigasi halaman yang sudah di-cache
- Kalkulator HPP tetap berfungsi offline
- Sistem draft untuk pesanan offline  
- Antrian sinkronisasi otomatis ketika online kembali
- Penyimpanan lokal dengan TTL dan versioning

### ✅ Performa Tinggi
- Service Worker untuk caching optimal
- Lazy loading untuk resource
- Optimasi bundle dan asset
- Progressive loading

## 📦 Instalasi PWA

### Desktop (Chrome, Edge, Safari)
1. Kunjungi [preview.monifine.my.id](https://preview.monifine.my.id)
2. Klik tombol "Install App" di header
3. Ikuti dialog instalasi browser
4. Aplikasi akan muncul di desktop/menu aplikasi

### Mobile (Android)
1. Buka [preview.monifine.my.id](https://preview.monifine.my.id) di Chrome
2. Masuk ke Settings → Fitur Offline
3. Ikuti panduan instalasi yang ditampilkan
4. Atau gunakan menu browser "Add to Home Screen"

### Mobile (iOS Safari)
1. Buka [preview.monifine.my.id](https://preview.monifine.my.id) di Safari
2. Tap tombol Share (kotak dengan panah)
3. Pilih "Add to Home Screen"
4. Sesuaikan nama dan tap "Add"

## 🔧 Konfigurasi PWA

### Manifest Configuration
```json
{
  "name": "HPP by Monifine",
  "short_name": "HPP Monifine",
  "description": "Aplikasi Hitung Harga Pokok Produksi untuk UMKM Kuliner",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "orientation": "portrait-primary",
  "categories": ["business", "productivity", "food"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    }
    // ... lebih banyak ukuran ikon
  ]
}
```

### Service Worker Features
- **Caching Strategies**: NetworkFirst, CacheFirst, StaleWhileRevalidate
- **Asset Caching**: JS, CSS, images, fonts
- **API Caching**: Dengan expiration dan invalidation
- **Offline Fallbacks**: Halaman offline dan asset cadangan
- **Background Sync**: Antrian operasi offline

## 📱 Fitur Offline

### 1. Storage System
- **LocalStorage dengan TTL**: Data expire otomatis
- **Versioning**: Migrasi data antar versi
- **Compression**: Optimasi ukuran penyimpanan
- **Backup/Restore**: Export/import data offline

### 2. Calculator Offline
- Hitung HPP tanpa koneksi internet
- History perhitungan tersimpan local
- Sinkronisasi otomatis saat online
- Cache resep dan bahan baku

### 3. Draft Order System
- Buat pesanan dalam mode offline
- Auto-save setiap perubahan
- Prioritas sinkronisasi
- Conflict resolution

### 4. Sync Queue
- Antrian operasi offline
- Retry mechanism dengan exponential backoff
- Prioritas berdasarkan jenis operasi
- Status tracking dan error handling

## 🎯 Penggunaan Fitur Offline

### Mengakses Fitur Offline
1. Klik menu sidebar → **"Fitur Offline"**
2. Atau akses langsung: `/offline`

### Dashboard Offline Features
- **Storage Status**: Penggunaan dan kapasitas
- **Sync Queue**: Operasi pending dan status
- **Cached Data**: Daftar data yang tersimpan offline
- **Connection Status**: Status koneksi real-time
- **Debug Info**: Informasi teknis (dev/preview only)

### Calculator Offline
```typescript
// Menggunakan offline calculator
import { offlineCalculatorStorage } from '@/lib/offlineStorage';

// Simpan hasil perhitungan
await offlineCalculatorStorage.saveCalculation({
  id: generateId(),
  recipe: recipeData,
  result: calculationResult,
  timestamp: Date.now()
});

// Ambil history
const history = await offlineCalculatorStorage.getHistory();
```

### Draft Orders
```typescript
// Membuat draft pesanan
import { draftOrdersStorage } from '@/lib/offlineStorage';

await draftOrdersStorage.saveDraft({
  id: generateId(),
  customerInfo: customerData,
  items: orderItems,
  total: totalAmount,
  status: 'draft'
});
```

## 🔄 Sistem Sinkronisasi

### Background Sync
- Otomatis saat koneksi kembali
- Retry dengan interval exponential
- Prioritas berdasarkan jenis data
- Error handling dan logging

### Manual Sync
```typescript
import { syncQueueStorage } from '@/lib/offlineStorage';

// Trigger manual sync
await syncQueueStorage.processPendingItems();
```

### Conflict Resolution
- Last-write-wins untuk data sederhana
- Merge strategy untuk data kompleks
- User intervention untuk konflik kritis

## 🐛 Debug dan Monitoring

### Debug Panel (Dev/Preview Only)
```typescript
const debugInfo = {
  serviceWorker: navigator.serviceWorker?.controller,
  installPrompt: window.deferredPrompt,
  storage: await navigator.storage?.estimate(),
  connection: navigator.onLine,
  userAgent: navigator.userAgent
};
```

### Performance Monitoring
- Cache hit rate
- Sync success rate
- Storage usage tracking
- Error rate monitoring

## 🔒 Security dan Privacy

### Data Security
- Tidak ada data sensitif di localStorage
- Enkripsi untuk data penting
- Session timeout otomatis
- Secure cookie handling

### Privacy
- Data hanya tersimpan lokal
- Sinkronisasi terenkripsi
- Tidak ada tracking third-party
- GDPR compliant

## 📊 Browser Support

| Browser | Desktop | Mobile | PWA Install | Offline |
|---------|---------|---------|-------------|---------|
| Chrome  | ✅      | ✅      | ✅          | ✅      |
| Firefox | ✅      | ✅      | ⚠️*         | ✅      |
| Safari  | ✅      | ✅      | ✅**        | ✅      |
| Edge    | ✅      | ✅      | ✅          | ✅      |

*Firefox: Add to desktop via browser menu
**Safari iOS: Add to Home Screen only

## 🚀 Performance Tips

### Optimal Usage
1. Install sebagai PWA untuk performa terbaik
2. Preload data penting saat online
3. Gunakan draft system untuk operasi offline
4. Monitor storage usage secara berkala

### Best Practices
- Sync data secara berkala saat online
- Bersihkan cache lama secara manual
- Backup data penting sebelum update
- Monitor status koneksi

## 🔧 Troubleshooting

### PWA Tidak Bisa Diinstall
1. Pastikan menggunakan HTTPS
2. Clear cache dan cookies
3. Restart browser
4. Cek manifest.json validity

### Offline Mode Tidak Bekerja
1. Cek service worker registration
2. Verify cache storage
3. Clear aplikasi cache
4. Reinstall PWA

### Sinkronisasi Gagal
1. Cek koneksi internet
2. Monitor sync queue status
3. Manual retry sinkronisasi
4. Clear pending queue jika perlu

## 📞 Support

Untuk bantuan teknis:
- 🐛 **Bug Report**: [GitHub Issues](https://github.com/your-repo/issues)
- 📧 **Email**: support@monifine.my.id
- 📱 **WhatsApp**: +62-xxx-xxxx-xxxx

---

*Dokumentasi ini diperbarui untuk versi PWA terbaru. Pastikan aplikasi Anda selalu update untuk fitur terbaru.*
