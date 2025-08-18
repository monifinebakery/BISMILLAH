# Excel Export Format

The `exportAllDataToExcel` utility generates an Excel workbook with multiple sheets.
Each dataset is written to its own sheet using the column mappings shown below.
The order of the columns follows the order of the mappings.

| Sheet | Columns |
|-------|---------|
| **Bahan Baku** | Nama Bahan, Kategori, Stok, Satuan, Harga Satuan (Rp), Stok Minimum, Supplier, Kadaluwarsa |
| **Supplier** | Nama Supplier, Kontak, Email, Telepon, Alamat |
| **Pembelian** | Tanggal, Supplier, Nama Barang, Jumlah, Satuan, Harga Satuan (Rp), Total Harga (Rp), Status |
| **Resep** | Nama Resep, Porsi, Nama Bahan, Jumlah, Satuan, Harga Satuan Bahan (Rp), Total Harga Bahan (Rp), Biaya Tenaga Kerja (Rp), Biaya Overhead (Rp), Total HPP (Rp), HPP per Porsi (Rp), Margin (%), Harga Jual per Porsi (Rp) |
| **Pesanan** | Nomor Pesanan, Tanggal, Nama Pelanggan, Telepon Pelanggan, Alamat Pengiriman, Nama Barang, Jumlah, Harga Satuan (Rp), Total Harga (Rp), Total Pesanan (Rp), Status, Catatan |
| **Template WhatsApp** | Status Pesanan, Template Pesan, Jumlah Karakter, Jumlah Baris, Jumlah Variabel |
| **Aset** | Nama Aset, Kategori, Nilai Awal (Rp), Nilai Saat Ini (Rp), Tanggal Pembelian, Kondisi, Lokasi |
| **Keuangan** | Tanggal, Tipe, Kategori, Deskripsi, Jumlah (Rp) |

