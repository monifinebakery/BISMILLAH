# 🎯 Feature: Material Dropdown with Purchase History

## 📋 Deskripsi Fitur

Fitur dropdown nama bahan baku yang cerdas dengan riwayat pembelian. Sekarang user tidak perlu mengetik ulang nama bahan baku yang sudah pernah dibeli sebelumnya.

## ✨ Fitur Utama

### 1. 📜 Dropdown Riwayat Bahan Baku
- Menampilkan daftar bahan baku yang pernah dibeli sebelumnya
- Diurutkan berdasarkan frekuensi penggunaan dan tanggal terakhir digunakan
- Menampilkan informasi tambahan: frekuensi (2x, 5x, dll.), satuan yang sering digunakan, dan waktu terakhir digunakan

### 2. 🔍 Smart Search & Autocomplete
- Search/filter nama bahan baku berdasarkan input user
- Support fuzzy matching untuk pencarian yang toleran typo
- Menampilkan hasil pencarian yang relevan dan diurutkan berdasarkan priority

### 3. ⚡ Auto-Suggestion Satuan
- Otomatis menyarankan satuan berdasarkan riwayat penggunaan
- Toast notification informatif ketika satuan disarankan
- Tidak override pilihan user jika sudah memilih satuan sendiri

### 4. 📝 Input Manual untuk Bahan Baru
- Tetap memungkinkan input manual untuk bahan baku yang belum pernah dibeli
- Option "Tambah [Nama Bahan]" untuk konfirmasi input bahan baru
- Toast notification untuk memberitahu bahwa bahan baru akan disimpan ke riwayat

## 🏗️ Struktur Implementasi

### File-file yang Ditambahkan:

1. **`MaterialsHistoryService.ts`**
   - Service untuk mengambil riwayat nama bahan baku dari database
   - Fungsi untuk search, filter, dan mendapatkan saran satuan
   - Caching dan optimasi performa

2. **`MaterialComboBox.tsx`**
   - Komponen dropdown yang mirip dengan SupplierComboBox
   - Integration dengan MaterialsHistoryService
   - UI yang user-friendly dengan icons dan informasi tambahan

3. **Modifikasi `NewItemForm.tsx`**
   - Mengganti input text biasa dengan MaterialComboBox
   - Auto-fill satuan berdasarkan riwayat
   - Update teks instruksi untuk menjelaskan fitur baru

## 🎨 UI/UX Improvements

### Visual Indicators:
- 📦 Package icon untuk material items
- 🕒 Clock icon untuk "last used" information
- ✅ Check icon untuk selected item
- ➕ Plus icon untuk new material option

### Information Display:
- **Frequency**: "2x", "5x" - berapa kali bahan ini pernah dibeli
- **Unit**: Satuan yang paling sering digunakan, highlighted dengan warna orange
- **Last Used**: "2 hari lalu", "1 minggu lalu" - kapan terakhir digunakan

### Smart Notifications:
- ✅ Success toast saat satuan disarankan berdasarkan riwayat
- ℹ️ Info toast saat menambah bahan baku baru
- 📊 Success toast dengan detail kalkulasi harga satuan

## 📊 Data Structure

### MaterialHistory Interface:
```typescript
interface MaterialHistory {
  nama: string;        // Nama bahan baku
  lastUsed: Date;      // Tanggal terakhir digunakan
  frequency: number;   // Berapa kali digunakan
  satuan?: string;     // Satuan yang paling sering digunakan
}
```

## ⚡ Performance Optimizations

1. **Lazy Loading**: Material history hanya dimuat ketika dropdown dibuka
2. **Caching**: Service menggunakan React state untuk cache hasil query
3. **Limited Results**: Hanya menampilkan 10 item teratas untuk performance
4. **Debounced Search**: Search tidak langsung trigger query database
5. **Smart Sorting**: Priority untuk exact match di awal, lalu frequency

## 🔧 Technical Details

### Database Query:
- Query table `purchases` untuk mengambil field `items`
- Extract semua nama bahan baku unique dari semua pembelian user
- Aggregate frequency dan last used date
- Sort berdasarkan frequency desc, then last used desc

### Integration dengan Existing Code:
- Compatible dengan existing purchase form flow
- Tidak break existing functionality
- Backward compatible dengan input manual

## 🎯 User Benefits

1. **Efisiensi Input**: Tidak perlu mengetik ulang nama bahan yang sama
2. **Konsistensi Data**: Mengurangi typo dan variasi nama yang sama
3. **Saran Cerdas**: Otomatis suggest satuan berdasarkan historical usage
4. **Better UX**: Visual feedback dan informasi yang helpful
5. **Faster Workflow**: Dropdown dengan search yang cepat dan akurat

## 🚀 Usage Instructions

### Untuk User:
1. Klik pada field "Nama Bahan Baku"
2. Lihat dropdown dengan riwayat bahan yang sering digunakan
3. Ketik untuk search/filter bahan yang diinginkan
4. Klik pada bahan dari riwayat, atau pilih "Tambah [Nama]" untuk bahan baru
5. Satuan akan otomatis terisi berdasarkan riwayat (jika tersedia)
6. Lanjutkan dengan input kuantitas dan total bayar seperti biasa

### Untuk Developer:
```tsx
// Import dan gunakan MaterialComboBox
import MaterialComboBox from '@/components/purchase/components/MaterialComboBox';

<MaterialComboBox
  value={formData.nama}
  onValueChange={(materialName, suggestedSatuan) => {
    setFormData(prev => ({ ...prev, nama: materialName }));
    // Auto-fill satuan jika disarankan
    if (suggestedSatuan && !prev.satuan) {
      setFormData(prevState => ({ ...prevState, satuan: suggestedSatuan }));
    }
  }}
  onSatuanSuggestion={(satuan) => {
    // Handle satuan suggestion
    if (!formData.satuan) {
      setFormData(prev => ({ ...prev, satuan: satuan }));
    }
  }}
  placeholder="Pilih dari riwayat atau ketik nama bahan baru"
  className="w-full"
/>
```

---

**Note**: Feature ini mengikuti user rules dari `.warp.md`:
- ✅ Responsive untuk mobile dan iPad
- ✅ Menggunakan pnpm untuk package management  
- ✅ Brand color orange untuk highlights dan accents
