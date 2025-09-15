# Panduan Konsistensi Penulisan Data dengan `snake_case`

Dokumen ini menetapkan standar penulisan nama field, kolom, dan kunci data di seluruh proyek agar menggunakan format `snake_case`.

## Aturan Penamaan
1. Seluruh huruf ditulis **kecil**.
2. Setiap kata dipisahkan oleh karakter underscore (`_`).
3. Tidak menggunakan spasi, huruf kapital, atau tanda hubung (`-`).
4. Berlaku untuk schema database, response API, dan struktur data lainnya.

## Contoh
| Benar (`snake_case`) | Salah |
|----------------------|-------|
| `total_nilai`        | `totalNilai`, `TotalNilai`, `total-nilai` |
| `tanggal_lahir`      | `tanggalLahir`, `TanggalLahir` |
| `harga_satuan`       | `hargaSatuan`, `harga-satuan` |

## Alasan Penggunaan
- **Konsistensi** antara backend dan frontend.
- **Kemudahan** integrasi dengan database PostgreSQL yang umumnya memakai `snake_case`.
- **Keterbacaan** yang lebih baik bagi seluruh anggota tim.

Dengan mengikuti panduan ini, seluruh data dalam proyek akan lebih mudah dipelihara, diintegrasikan, dan dihindari dari kesalahan penulisan.

## Implementasi Bertahap (Orders & Recipe)

- Modul yang dimigrasikan terlebih dahulu: `orders` dan `recipe`.
- Helper konversi tersedia agar transisi tidak mematahkan UI lama:
  - Orders: `src/components/orders/naming.ts` — fungsi `to_snake_order`, `from_snake_order` untuk mapping camelCase ⇄ snake_case.
  - Recipe: `src/components/recipe/services/recipeTransformers.ts` — fungsi `to_snake_recipe`, `from_snake_recipe`.

### Aturan ESLint Khusus

ESLint telah dikonfigurasi untuk memaksa snake_case pada properti di folder `orders` dan `recipe`. Perbaiki lint error secara bertahap dengan mengganti nama field ke snake_case.

## Implementasi (Orders & Recipe) — Final

Modul `orders` dan `recipe` sekarang mengikuti standar ini dan UI sudah menggunakan pola baca yang aman.

### Prinsip Utama
- DB dan API: canonical `snake_case`.
- UI render: baca `snake_case` lalu fallback ke `camelCase` (untuk backward-compat). 
- Form state internal: boleh `camelCase` selama submit/fetch memakai transformer.

### Helper Konversi
- Orders: `src/components/orders/naming.ts` — `to_snake_order`, `from_snake_order`.
- Orders utils: `transformOrderFromDB`, `transformOrderToDB` (menormalkan tipe FE dan mapping tanggal).
- Recipe: API service `recipeApi` sudah mengembalikan tipe `Recipe` dengan normalisasi.

### Peta Field — Orders
Canonical (DB/API) → Fallback (FE) → Keterangan
- `nomor_pesanan` → `nomorPesanan`/`order_number`
- `nama_pelanggan` → `namaPelanggan`/`customer_name`
- `telepon_pelanggan` → `teleponPelanggan`/`customer_phone`
- `email_pelanggan` → `emailPelanggan`/`customer_email`
- `alamat_pengiriman` → `alamatPengiriman`
- `tanggal` → `tanggal` (Date)
- `tanggal_selesai` → `tanggalSelesai` (Date)
- `subtotal` → `subtotal`
- `pajak` → `pajak`/`tax_amount`
- `total_pesanan` → `totalPesanan`/`total_amount`
- `items` → `items`

Komponen yang sudah diselaraskan: OrderTable, VirtualOrderTable, OrderFilters, OrdersAddEditPage, OrderForm dialog, OrderProvider/orderService (status update, add/update, pagination).

### Peta Field — Recipe
Canonical (DB/API) → Fallback (FE) → Keterangan
- `nama_resep` → `namaResep`
- `kategori_resep` → `kategoriResep`
- `deskripsi` → `deskripsi`
- `bahan_resep` → `bahanResep`
- `jumlah_porsi` → `jumlahPorsi`
- `jumlah_pcs_per_porsi` → `jumlahPcsPerPorsi`
- `hpp_per_porsi` → `hppPerPorsi`
- `hpp_per_pcs` → `hppPerPcs`
- `harga_jual_porsi` → `hargaJualPorsi`
- `harga_jual_per_pcs` → `hargaJualPerPcs`
- `margin_keuntungan_persen` → `marginKeuntunganPersen`
- `created_at`/`updated_at` → `createdAt`/`updatedAt`

Komponen yang sudah diselaraskan: RecipeStats, RecipeTable, RecipeCardView, RecipeBreadcrumb, DuplicateRecipeDialog, BulkOperationsDialog, RecipeNavigationContainer, dashboard ingredient usage.

### Pola Baca Aman di UI
```tsx
const any: any = data;
const nama = any.nama_resep ?? any.namaResep ?? '';
const kategori = any.kategori_resep ?? any.kategoriResep ?? '';
const hpp = Number(any.hpp_per_porsi ?? any.hppPerPorsi) || 0;
```

### Do/Don’t
- Do: tambah kolom baru sebagai `snake_case` di DB/API.
- Do: gunakan transformer saat submit/fetch.
- Do: render dengan pola snake→camel fallback.
- Don’t: hardcode hanya `camelCase` di rendering.

### Checklist PR
- [ ] UI membaca snake_case dengan fallback camelCase
- [ ] Submit/fetch pakai transformer
- [ ] Tidak ada referensi langsung ke properti yang tidak dinormalisasi

### Ringkasan Perubahan Terbaru
- Orders: kolom “Nama Pelanggan” konsisten (baca `nama_pelanggan` → `namaPelanggan` → `customer_name`).
- Items-per-page di filters berfungsi (menggunakan `uiState.setItemsPerPage`).
- Recipe: seluruh list/stats/cards/dialogs telah digeser ke pola baca snake_case terlebih dahulu.
