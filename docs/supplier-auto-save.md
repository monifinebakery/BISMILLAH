# Fitur Auto-Save Supplier dari Purchase

## Deskripsi

Fitur ini memungkinkan pengguna untuk menambahkan supplier baru secara otomatis saat melakukan pembelian (purchase). Ketika pengguna mengetik nama supplier yang belum ada dalam database, sistem akan secara otomatis membuat supplier baru tanpa perlu ke menu supplier terpisah.

## Cara Kerja

### 1. Input Supplier di Purchase Dialog

- **Select/Input Combo**: Pengguna dapat memilih dari supplier yang sudah ada atau mengetik nama supplier baru
- **Visual Indicator**: Sistem menunjukkan badge "Baru" untuk supplier yang belum ada dalam database
- **Pencarian**: Pengguna dapat mencari supplier yang sudah ada dengan mengetik nama atau kontak

### 2. Auto-Save Logic

```typescript
// Ketika user menyimpan purchase
const supplierIdToUse = await getOrCreateSupplierId(supplierName);
```

**Proses Auto-Save:**

1. **Cek Existing**: Sistem mengecek apakah supplier sudah ada berdasarkan nama (case-insensitive)
2. **Use Existing**: Jika sudah ada, gunakan ID supplier yang sudah ada
3. **Create New**: Jika belum ada, buat supplier baru dengan data minimal:
   - `nama`: Nama yang diinput user
   - `kontak`: String kosong (bisa diupdate nanti)
   - `catatan`: "Auto-created from purchase"
   - Field lain (email, telepon, alamat): undefined

### 3. Pencegahan Duplikasi

- **Case-Insensitive Match**: "PT ABC" dan "pt abc" dianggap sama
- **Trim Whitespace**: Spasi di awal/akhir diabaikan
- **Exact Name Match**: Hanya nama yang persis sama yang dianggap duplikat

## Komponen yang Terlibat

### 1. SupplierComboBox Component

```typescript
<SupplierComboBox
  value={supplierValue}
  onValueChange={(name, id) => {
    // Jika ada ID, gunakan ID (existing supplier)
    // Jika tidak ada ID, gunakan name (new supplier)
    updateField('supplier', id || name);
  }}
  suppliers={suppliers}
  placeholder="Pilih atau tulis nama supplier"
/>
```

**Fitur:**
- ✅ Responsive untuk mobile & iPad
- ✅ Pencarian supplier existing
- ✅ Input supplier baru
- ✅ Visual indicator untuk supplier baru
- ✅ Keyboard navigation

### 2. useSupplierAutoSave Hook

```typescript
const {
  findSupplierByName,     // Cari supplier berdasarkan nama
  autoSaveSupplier,       // Simpan supplier jika belum ada
  getOrCreateSupplierId   // Dapatkan ID (existing/buat baru)
} = useSupplierAutoSave();
```

### 3. Integration dengan Purchase Form

```typescript
// Di usePurchaseForm.handleSubmit()
const supplierIdToUse = await getOrCreateSupplierId(formData.supplier);

const purchaseData = {
  ...formData,
  supplier: supplierIdToUse, // Gunakan ID yang sudah di-resolve
  // ... field lainnya
};
```

## User Experience

### Skenario 1: Pilih Supplier Existing
1. User klik dropdown supplier
2. User melihat list supplier yang sudah ada
3. User pilih salah satu
4. Form menggunakan ID supplier yang dipilih

### Skenario 2: Input Supplier Baru
1. User klik dropdown supplier
2. User ketik nama supplier baru (misal: "PT Supplier Baru")
3. Sistem menampilkan opsi "Tambah PT Supplier Baru" dengan badge "Baru"
4. User klik opsi tersebut atau langsung save purchase
5. Sistem otomatis membuat supplier baru
6. Purchase tersimpan dengan referensi ke supplier baru

### Skenario 3: Input Supplier yang Mirip Existing
1. User ketik "pt abc" (padahal sudah ada "PT ABC")
2. Sistem mendeteksi kesamaan (case-insensitive)
3. Sistem menggunakan supplier existing "PT ABC"
4. Tidak ada duplikasi yang terjadi

## Manfaat

### Untuk User
- ✅ **Efisiensi**: Tidak perlu pindah ke menu supplier untuk menambah supplier baru
- ✅ **Kemudahan**: Bisa langsung input supplier sambil buat purchase
- ✅ **Pencegahan Error**: Tidak ada duplikasi supplier
- ✅ **Flexibility**: Bisa pilih existing atau buat baru dalam satu interface

### Untuk Data Integrity
- ✅ **Konsistensi**: Semua supplier tersimpan dalam tabel suppliers
- ✅ **Relational**: Purchase tetap punya referensi yang benar ke supplier
- ✅ **Audit Trail**: Supplier auto-created punya marking khusus
- ✅ **No Orphan Data**: Tidak ada data supplier yang terputus

## Technical Details

### Database Schema
```sql
-- Tabel suppliers sudah ada
suppliers {
  id: uuid (primary key)
  nama: string (required)
  kontak: string 
  email: string (optional)
  telepon: string (optional)
  alamat: string (optional)
  catatan: string (optional, "Auto-created from purchase" untuk auto-created)
  user_id: uuid (foreign key)
  created_at: timestamp
  updated_at: timestamp
}

-- Tabel purchases referensi ke suppliers
purchases {
  -- ...field lainnya
  supplier: string (berisi ID supplier, bukan nama)
}
```

### Error Handling

1. **Gagal Buat Supplier**: Jika gagal buat supplier baru, purchase tetap bisa tersimpan dengan nama supplier
2. **Koneksi Error**: Sistem retry dengan fallback ke nama supplier
3. **Validation Error**: Error ditampilkan ke user dengan pesan yang jelas

### Performance Considerations

- **Lazy Loading**: Supplier list dimuat saat dibutuhkan
- **Caching**: Context menggunakan React Query untuk caching
- **Debounced Search**: Pencarian supplier menggunakan debounce
- **Minimal Data**: Supplier auto-created hanya dengan data minimal

## Testing

### Unit Tests
- ✅ Test pencarian supplier existing (case-insensitive)
- ✅ Test pembuatan supplier baru
- ✅ Test pencegahan duplikasi
- ✅ Test error handling

### Integration Tests
- ✅ Test end-to-end flow dari purchase ke supplier auto-save
- ✅ Test UI interaction dengan SupplierComboBox
- ✅ Test responsive behavior di mobile/iPad

### Manual Testing Checklist

**Supplier Baru:**
- [ ] Input supplier baru berhasil tersimpan
- [ ] Badge "Baru" muncul untuk supplier baru  
- [ ] Purchase tersimpan dengan referensi supplier yang benar
- [ ] Supplier muncul di menu Supplier Management

**Supplier Existing:**
- [ ] Pencarian supplier existing berfungsi
- [ ] Case-insensitive matching berfungsi
- [ ] Tidak ada duplikasi supplier
- [ ] Performance tetap baik dengan banyak supplier

**Edge Cases:**
- [ ] Handle nama supplier kosong
- [ ] Handle nama supplier dengan karakter khusus
- [ ] Handle error network saat auto-save
- [ ] Handle supplier dengan nama sangat panjang

## Future Enhancements

### Short Term
- [ ] Bulk import supplier dari CSV
- [ ] Auto-complete yang lebih smart (fuzzy search)
- [ ] Undo action untuk supplier yang salah dibuat

### Long Term  
- [ ] AI suggestion untuk supplier yang mirip
- [ ] Integasi dengan supplier database eksternal
- [ ] Advanced duplicate detection (alamat, email, dll)

## Migration Guide

Fitur ini backward compatible dengan data existing:
1. Purchase yang sudah ada tetap berfungsi normal
2. Supplier yang sudah ada tidak terpengaruh  
3. Format data purchase tidak berubah
4. API signature tetap sama
