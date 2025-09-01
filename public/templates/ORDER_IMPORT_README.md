# Order Import dengan Per-Piece Pricing - Panduan Lengkap

## 🆕 Fitur Baru: Harga Per Pcs

Sekarang sistem import pesanan mendukung dua mode pricing:
- **Per Porsi** (`per_portion`): Harga per porsi/unit besar
- **Per Pcs** (`per_piece`): Harga per piece/unit kecil

## 📁 Template Yang Tersedia

### 1. Template Sederhana (`order-import-template.csv`)
Template dasar dengan contoh data untuk langsung digunakan.

### 2. Template + Panduan (`order-import-template-with-docs.csv`)
Template lengkap dengan dokumentasi dan berbagai contoh kasus.

## 📊 Struktur CSV

### Kolom Wajib
| Kolom | Deskripsi | Contoh |
|-------|-----------|--------|
| `pelanggan` | Nama pelanggan/toko | "PT Contoh", "Toko ABC" |
| `tanggal` | Tanggal pesanan (YYYY-MM-DD) | "2025-01-01" |
| `nama` | Nama produk/item | "Nasi Gudeg", "Kerupuk" |
| `kuantitas` | Jumlah pesanan | 10, 5, 20 |
| `satuan` | Satuan kuantitas | "porsi", "pcs", "gelas" |
| `harga` | Harga default/fallback | 50000, 8000 |

### Kolom Opsional (Per-Piece Pricing)
| Kolom | Deskripsi | Nilai |
|-------|-----------|-------|
| `pricing_mode` | Mode pricing | "per_portion" atau "per_piece" |
| `price_per_portion` | Harga per porsi | 50000 (wajib jika mode per_portion) |
| `price_per_piece` | Harga per pcs | 15000 (wajib jika mode per_piece) |

## 🎯 Contoh Penggunaan

### Kasus 1: Pricing Per Porsi
```csv
pelanggan;tanggal;nama;kuantitas;satuan;pricing_mode;price_per_portion;price_per_piece;harga
PT Contoh;2025-01-01;Nasi Gudeg;10;porsi;per_portion;50000;15000;50000
```
- Mode: `per_portion`
- Harga aktif: 50,000 per porsi
- Total: 10 × 50,000 = 500,000

### Kasus 2: Pricing Per Piece
```csv
pelanggan;tanggal;nama;kuantitas;satuan;pricing_mode;price_per_portion;price_per_piece;harga
Restoran XYZ;2025-01-02;Kerupuk;20;pcs;per_piece;;2500;2500
```
- Mode: `per_piece`
- Harga aktif: 2,500 per pcs
- Total: 20 × 2,500 = 50,000

### Kasus 3: Fallback ke Harga Default
```csv
pelanggan;tanggal;nama;kuantitas;satuan;pricing_mode;price_per_portion;price_per_piece;harga
Cafe DEF;2025-01-03;Kopi Susu;2;gelas;;;25000
```
- Mode: kosong (fallback)
- Harga aktif: 25,000 (dari kolom harga)
- Total: 2 × 25,000 = 50,000

## ⚡ Fitur Import

### Validasi Otomatis
- ✅ Cek kolom wajib
- ✅ Validasi konsistensi pricing mode
- ✅ Error handling dengan pesan detail
- ✅ Support koma (,) dan titik koma (;) sebagai delimiter

### Grouping Otomatis
- Pesanan dengan pelanggan dan tanggal sama digabung otomatis
- Setiap item dalam pesanan tetap terpisah
- Total pesanan dihitung otomatis

### Error Handling
- Pesan error spesifik per baris
- Validasi pricing mode consistency
- Fallback graceful ke harga default

## 🔧 Cara Menggunakan

1. **Download Template**
   - Klik "Import" → "Template Sederhana" atau "Template + Panduan"

2. **Isi Data**
   - Gunakan Excel, Google Sheets, atau text editor
   - Pastikan format tanggal: YYYY-MM-DD
   - Isi pricing fields sesuai mode yang dipilih

3. **Upload File**
   - Klik "Import" → "Upload CSV"
   - Pilih file CSV yang sudah diisi
   - Sistem akan validasi dan import otomatis

4. **Verifikasi Hasil**
   - Cek pesanan yang berhasil diimport
   - Pastikan pricing mode dan total sudah benar

## 🛠️ Tips & Best Practices

### Format Data
- Gunakan format tanggal ISO: `2025-01-01`
- Gunakan angka tanpa pemisah ribuan: `50000` bukan `50,000`
- Kosongkan field opsional dengan cara tidak mengisi atau menggunakan tanda `;`

### Pricing Mode
- Jika menggunakan `per_portion`, pastikan `price_per_portion` diisi
- Jika menggunakan `per_piece`, pastikan `price_per_piece` diisi
- Jika tidak menggunakan pricing mode, kolom `harga` wajib diisi

### Grouping
- Pesanan dengan kombinasi `pelanggan + tanggal` sama akan digabung
- Untuk pesanan terpisah, gunakan tanggal berbeda atau nama pelanggan berbeda

## ❗ Troubleshooting

### Error: "Kolom wajib tidak lengkap"
- Pastikan semua kolom wajib ada: pelanggan, tanggal, nama, kuantitas, satuan, harga

### Error: "pricing_mode 'per_portion' memerlukan price_per_portion yang valid"
- Isi kolom `price_per_portion` dengan nilai lebih dari 0

### Error: "pricing_mode 'per_piece' memerlukan price_per_piece yang valid"
- Isi kolom `price_per_piece` dengan nilai lebih dari 0

### Error: "harga harus lebih dari 0"
- Pastikan kolom `harga` diisi dengan nilai valid sebagai fallback

## 📞 Dukungan

Jika mengalami masalah:
1. Cek format CSV sesuai panduan
2. Gunakan "Template + Panduan" sebagai referensi
3. Pastikan semua kolom wajib diisi dengan benar
4. Verifikasi consistency antara pricing_mode dan price fields
