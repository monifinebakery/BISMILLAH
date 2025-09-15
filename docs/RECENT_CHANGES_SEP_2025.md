# Recent Changes — September 2025

## Warehouse
- Auth-safe service creation in `WarehousePage.tsx`:
  - Service hanya dibuat ketika user tersedia dari Supabase (`getUser()`)
  - Jika user belum siap: fetch mengembalikan `[]` (tidak melempar error) agar UI tidak jatuh ke ErrorBoundary
  - Service di-recreate jika user berubah (hindari stale `user_id`)

## Orders
- Statistik pendapatan kini menggunakan pesanan `completed` saja:
  - `OrderStatistics.tsx` dan header stats (useOrderStats) selaras: revenue & AOV dari completed
  - AOV dihitung sebagai: `totalRevenue(completed) / jumlahCompleted`
  - Mencegah mismatch antara kartu statistik dan header

## Purchase
- Standarisasi field item:
  - FE: `quantity`, `unitPrice`, `subtotal`, `nama`, `satuan`
  - DB: `jumlah`, `harga_per_satuan`, `subtotal`, `nama`, `satuan`
  - Transformer memetakan dua arah secara konsisten
- Persistensi total:
  - `transformPurchaseForDB` memastikan `total_nilai` terisi dari `totalNilai`/`total_nilai` agar draft tidak tersimpan sebagai 0
- Guard penyelesaian:
  - UI memblokir status `completed` jika `total_nilai <= 0` (hindari check constraint DB)
- Validasi item saat completion:
  - Memeriksa `quantity` (bukan nama lama `kuantitas`) untuk mencegah pesan palsu “Item \"X\" tidak lengkap”

## Troubleshooting
- “Item \"X\" tidak lengkap”: Pastikan tiap item memiliki `nama`, `quantity > 0`, `satuan`, dan `unitPrice >= 0`.
- “RLS/Unauthorized di Warehouse”: Halaman gudang kini aman; data kosong sementara saat auth warming up adalah expected behavior.

## Commits Terkait
- fix(warehouse+orders): auth-safe warehouse service and order form validation
- fix(orders+purchase): correct revenue calc and purchase draft total
- feat(orders): align header stats with completed-only revenue
- fix(purchase): correct item field mappings (quantity/unitPrice) and numeric coercion
- guard(purchase): prevent completing with zero total

