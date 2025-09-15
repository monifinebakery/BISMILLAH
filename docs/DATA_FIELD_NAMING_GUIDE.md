# Data Field Naming Guide (snake_case ↔ camelCase)

Dokumen ini menjadi referensi tunggal untuk standardisasi penamaan field antara database (snake_case) dan frontend (camelCase) di seluruh modul aplikasi: Purchase, Warehouse, Recipe, Orders, Profit Analysis, Invoice, dsb.

Tujuan:
- Meminimalkan mismatch penamaan dan bug transformasi.
- Mempercepat integrasi antar modul dan saat menulis query Supabase.
- Menjadi acuan saat menambah field baru (DB: snake_case, FE: camelCase).

Catatan umum:
- Database: gunakan snake_case (yang dikonsumsi oleh Supabase PostgREST).
- Frontend/TypeScript: gunakan camelCase di state/props/komponen.
- Transformer utilitas bertugas mapping dua arah di layer service atau helper.

## Konvensi Umum (Global)

- id ↔ id
- user_id ↔ userId
- created_at ↔ createdAt
- updated_at ↔ updatedAt
- tanggal (date/datetime) ↔ tanggal (Date/string di FE sesuai konteks)
- keterangan ↔ keterangan

## Warehouse: bahan_baku

DB (snake_case) ↔ FE (camelCase)
- id ↔ id
- user_id ↔ userId
- nama ↔ nama
- kategori ↔ kategori
- stok ↔ stok
- satuan ↔ satuan
- minimum ↔ minimum
- harga_satuan ↔ unitPrice
- harga_rata_rata ↔ averagePrice (atau akses langsung sebagai `harga_rata_rata` jika menggunakan standar snake di analitik)
- supplier ↔ supplier
- tanggal_kadaluwarsa ↔ tanggalKadaluwarsa
- created_at ↔ createdAt
- updated_at ↔ updatedAt

Catatan:
- Di analitik/HPP, kita standarkan base price sebagai `unit_price` (camelCase: unitPrice). Jika sumber dari bahan_baku adalah `harga_satuan`, lakukan mapping `unit_price = harga_satuan` di layer service.

## Pemakaian Bahan: pemakaian_bahan

DB (snake_case) ↔ FE (camelCase)
- id ↔ id
- user_id ↔ userId
- bahan_baku_id ↔ bahanBakuId
- qty_base ↔ quantity
- tanggal ↔ tanggal
- harga_efektif ↔ hargaEfektif
- hpp_value ↔ hppValue
- source_type ↔ sourceType
- source_id ↔ sourceId
- keterangan ↔ keterangan
- created_at ↔ createdAt
- updated_at ↔ updatedAt

Catatan:
- Aplikasi menyediakan alias `quantity` dari `qty_base` untuk kompatibilitas kalkulator lama.

## Recipe: recipes (definisi dan kalkulasi HPP)

DB (snake_case) ↔ FE (camelCase)
- id ↔ id
- user_id ↔ userId
- nama_resep ↔ namaResep
- kategori_resep ↔ kategoriResep
- deskripsi ↔ deskripsi
- foto_url ↔ fotoUrl
- bahan_resep (JSONB) ↔ bahanResep (array objek)
- jumlah_porsi ↔ jumlahPorsi
- jumlah_pcs_per_porsi ↔ jumlahPcsPerPorsi
- biaya_tenaga_kerja ↔ biayaTenagaKerja
- biaya_overhead ↔ biayaOverhead
- margin_keuntungan_persen ↔ marginKeuntunganPersen
- total_hpp ↔ totalHpp
- hpp_per_porsi ↔ hppPerPorsi
- hpp_per_pcs ↔ hppPerPcs
- harga_jual_porsi ↔ hargaJualPorsi
- harga_jual_per_pcs ↔ hargaJualPerPcs
- created_at ↔ createdAt
- updated_at ↔ updatedAt

Objek bahan_resep (elemen array)
- id ↔ id
- nama ↔ nama
- jumlah ↔ jumlah
- satuan ↔ satuan
- harga_satuan ↔ hargaSatuan
- total_harga ↔ totalHarga
- warehouse_id ↔ warehouseId (opsional)

## Purchase: purchases

DB (snake_case) ↔ FE (camelCase)
- id ↔ id
- user_id ↔ userId
- supplier ↔ supplier
- tanggal (YYYY-MM-DD) ↔ tanggal (Date/string)
- total_nilai ↔ totalNilai
- metode_perhitungan ↔ metodePerhitungan
- status ↔ status
- keterangan ↔ keterangan
- created_at ↔ createdAt
- updated_at ↔ updatedAt

Item pembelian (purchases.items)
- bahan_baku_id ↔ bahanBakuId
- nama ↔ nama
- satuan ↔ satuan
- quantity ↔ quantity (standar; dari jumlah/kuantitas)
- unit_price ↔ unitPrice (standar; dari harga_per_satuan/hargaSatuan)
- subtotal ↔ subtotal
- keterangan ↔ keterangan

## Orders: orders (ringkas)

DB (snake_case) ↔ FE (camelCase)
- id ↔ id
- user_id ↔ userId
- customer_id ↔ customerId
- status ↔ status
- total_nilai ↔ totalNilai
- tanggal ↔ tanggal
- items (JSONB) ↔ items

Item order (umum)
- recipe_id ↔ recipeId (jika dari resep)
- quantity ↔ quantity
- unit_price ↔ unitPrice
- total_price ↔ totalPrice

Catatan:
- Beberapa modul orders di UI sudah memakai snake_case langsung untuk konsistensi baru. Jika memakai camelCase di UI, pastikan transform.

## Financial: financial_transactions (ringkas)

DB (snake_case) ↔ FE (camelCase)
- id ↔ id
- user_id ↔ userId
- type ↔ type
- category ↔ category
- amount ↔ amount
- description ↔ description
- date ↔ date
- created_at ↔ createdAt

## Invoice: invoices (ringkas)

DB (snake_case) ↔ FE (camelCase)
- id ↔ id
- user_id ↔ userId
- customer_id ↔ customerId
- total_amount ↔ totalAmount
- status ↔ status
- issued_at ↔ issuedAt
- due_at ↔ dueAt

Item invoice
- description ↔ description
- quantity ↔ quantity
- unit_price ↔ unitPrice

## Suppliers: suppliers (ringkas)

DB (snake_case) ↔ FE (camelCase)
- id ↔ id
- user_id ↔ userId
- nama ↔ nama
- email ↔ email
- phone ↔ phone
- alamat ↔ alamat
- created_at ↔ createdAt
- updated_at ↔ updatedAt

## Assets: assets (ringkas)

DB (snake_case) ↔ FE (camelCase)
- id ↔ id
- user_id ↔ userId
- nama_aset ↔ namaAset
- kategori ↔ kategori
- nilai_perolehan ↔ nilaiPerolehan
- tanggal_perolehan ↔ tanggalPerolehan
- umur_ekonomis_bulan ↔ umurEkonomisBulan
- penyusutan_per_bulan ↔ penyusutanPerBulan

## Profit Analysis (turunan)

Standar harga satuan
- unit_price (standar turunan) ↔ unitPrice (FE) — source dari harga_satuan (bahan_baku) atau WAC (`harga_rata_rata`).

Standar perhitungan
- WAC (harga_rata_rata) diutamakan; fallback ke unit_price.
- pemakaian_bahan.qty_base di-alias sebagai quantity di FE kalkulator.

## Utilitas Mapping (saran)

Gunakan helper berikut untuk konsisten:
- src/utils/typeConverters.ts — mapping umum (contoh: unitPrice ↔ unit_price).
- src/components/recipe/services/recipeApi.ts — transformFromDB/transformToDB untuk recipes.
- src/components/warehouse/services/warehouseApi.ts — normalisasi bahan_baku.
- src/components/profitAnalysis/services/warehouseHelpers.ts — standardisasi harga ke unit_price dan alias quantity.
- src/components/purchase/utils/purchaseTransformers.ts — normalisasi purchase (bila tersedia).

## Prinsip Saat Menambah Field Baru

1) Tambah di DB dengan snake_case.
2) Tambah di tipe FE dengan camelCase.
3) Update transformer service (ToDB/FromDB) untuk mapping 2 arah.
4) Jika field ikut dalam JSONB (mis. bahan_resep), konsistenkan penamaan internal (gunakan snake_case agar sejalan dengan DB) atau pastikan mapping jelas di boundary.

## Catatan Implementasi Terbaru

- bahan_baku: gunakan `harga_satuan` di DB, mapping ke `unit_price` (FE: unitPrice) untuk proses analitik.
- pemakaian_bahan: gunakan `qty_base` di DB; aplikasi mengekspose alias `quantity` pada FE untuk kalkulator lama.
- Recipe: form menormalkan input snake/camel untuk menghindari error iterable pada `bahanResep`.

