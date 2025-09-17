# Panduan Pemakaian Bahan (Manual Usage Logging)

Dokumen ini menjelaskan cara mencatat pemakaian bahan baku secara manual, bagaimana nilainya dihitung, dan bagaimana data tersebut digunakan oleh Profit Analysis untuk menghitung Modal Bahan (COGS/HPP bahan).

## Tujuan
- Merekam pemakaian bahan baku per tanggal.
- Menghitung nilai HPP pemakaian dengan prioritas harga WAC (Weighted Average Cost) lalu fallback ke harga dasar.
- Mengalirkan total HPP pemakaian ke Profit Analysis sesuai rentang tanggal yang dipilih.

## Cara Kerja Singkat
- Sumber data bahan: tabel `bahan_baku` (memuat `harga_rata_rata`/WAC dan `harga_satuan`).
- Pencatatan pemakaian: tabel `pemakaian_bahan` (per tanggal, per bahan, qty, nilai HPP).
- Harga efektif: `WAC (harga_rata_rata) > 0` → pakai WAC; jika tidak, pakai `harga_satuan`.
- Nilai HPP baris pemakaian: `qty_base × harga_efektif` dan disimpan ke `hpp_value`.
- Profit Analysis membaca agregasi `pemakaian_bahan` (materialized view `pemakaian_bahan_daily_mv` bila tersedia) untuk menambah “Modal bahan”.

## Prasyarat
1. Pembelian bahan sudah diinput dan “Diselesaikan/Completed” supaya WAC (`harga_rata_rata`) ter-update.
2. Item gudang konsisten (hindari duplikasi bahan sejenis dengan ID berbeda).
3. Satuan bahan jelas (kg, gr, liter, pcs, dll) agar qty bermakna.

## Lokasi Fitur
- Halaman: `/pemakaian`
- Komponen: `src/components/warehouse/PemakaianBahanPage.tsx`

## Langkah Mencatat Pemakaian
1. Buka `/pemakaian`.
2. Pilih bahan.
3. Pilih tanggal pemakaian (pastikan berada dalam rentang analisis yang ingin dievaluasi).
4. Masukkan `Qty` sesuai satuan bahan (misal 2 kg).
5. (Opsional) Isi catatan.
6. Klik `Simpan Pemakaian`.
7. “Pemakaian Terakhir” menampilkan 10 entri terbaru sebagai konfirmasi cepat.

## Field yang Disimpan (tabel `pemakaian_bahan`)
- `user_id`: ID pengguna (otomatis).
- `bahan_baku_id`: ID bahan.
- `qty_base`: jumlah pemakaian (angka desimal boleh).
- `tanggal`: tanggal pemakaian (YYYY-MM-DD).
- `harga_efektif`: harga satuan efektif yang dipakai saat simpan (WAC atau harga dasar).
- `hpp_value`: nilai HPP hasil `qty_base × harga_efektif`.
- `keterangan`: catatan opsional.
- `source_type`: di-set `manual` oleh form ini.

## Perhitungan Harga Efektif
- Jika `bahan_baku.harga_rata_rata > 0` → gunakan itu (WAC).
- Jika tidak, gunakan `bahan_baku.harga_satuan`.
- Total HPP baris = `qty_base × harga_efektif` (disimpan ke `hpp_value`).

## Dampak ke Profit Analysis
- Profit Analysis menjumlahkan `hpp_value` per hari pada periode yang dipilih dan menampilkannya sebagai “Modal bahan/COGS”.
- Jika kamu tidak melihat perubahan:
  - Pastikan tanggal pemakaian ada di rentang analisis.
  - Pastikan `harga_rata_rata`/`harga_satuan` bahan tidak 0.
  - Pastikan `bahan_baku_id` yang dipakai benar (bahan yang sama dengan pembeliannya).
  - Coba refresh halaman atau jalankan sync/refresh WAC bila tersedia.

## Praktik Terbaik
- Selesaikan pembelian agar WAC akurat sebelum mencatat pemakaian besar.
- Konsisten satuan bahan antara pembelian, gudang, dan pemakaian.
- Hindari membuat bahan baru untuk item yang sama; gunakan bahan gudang yang sudah ada agar WAC terakumulasi benar.

## Troubleshooting
- “Modal bahan” tidak naik:
  - Cek entri di `/pemakaian` (sudah tersimpan?),
  - Cek tanggal masuk ke periode analisis,
  - Cek `harga_rata_rata`/`harga_satuan` ≠ 0.
- WAC 0 padahal sudah beli:
  - Pastikan status pembelian selesai/`completed`.
  - Jalankan fitur recalculation/sync WAC (jika tersedia di menu gudang).
- Error RLS/akses:
  - Pastikan sudah login; fitur hanya menarik data milik user saat ini (RLS aktif).

## Catatan Teknis
- UI menyimpan langsung ke tabel `pemakaian_bahan` via Supabase JS client.
- Profit Analysis mengonsumsi data via helper:
  - `fetchPemakaianByPeriode()` dan/atau agregasi `pemakaian_bahan_daily_mv`.
  - Komponen terkait: `src/components/profitAnalysis/services/warehouseHelpers.ts`, `dataParsers.ts`.

## Rencana Pengembangan (Opsional)
- Auto-catatan pemakaian dari produksi/pesanan berbasis Resep.
- Import CSV untuk batch input pemakaian.
- Edit/hapus entri pemakaian dari daftar riwayat.

