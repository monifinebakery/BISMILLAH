import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

// Deklarasikan XLSX agar TypeScript tidak error karena diimpor dari <script> di index.html
declare const XLSX: any;

/**
 * Membersihkan dan memformat array data untuk diekspor ke Excel.
 * Mengubah objek/array menjadi string JSON dan memformat tanggal.
 * @param data Array objek data mentah.
 * @param headers Objek pemetaan dari kunci data (camelCase) ke nama kolom Excel.
 * @returns Array objek yang siap untuk diubah menjadi sheet Excel.
 */
const cleanDataForExport = (data: any[], headers: { [key: string]: string }) => {
  if (!data || !Array.isArray(data)) {
    return []; // Kembalikan array kosong jika data tidak valid
  }

  const headerKeys = Object.keys(headers);
  return data.map(row => {
    const newRow: { [key: string]: any } = {};
    for (const key of headerKeys) {
      let value = row[key];
      
      if (value instanceof Date) {
        value = format(value, 'yyyy-MM-dd HH:mm:ss');
      } else if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      newRow[headers[key]] = value;
    }
    return newRow;
  });
};

/**
 * Mengekspor semua data aplikasi ke satu file Excel dengan beberapa sheet.
 * @param allData Objek yang berisi semua array data dari konteks (bahanBaku, suppliers, dll.).
 * @param businessName Nama bisnis pengguna untuk nama file kustom.
 */
export const exportAllDataToExcel = (allData: any, businessName?: string) => {
  try {
    const wb = XLSX.utils.book_new(); // Buat workbook Excel baru

    // Definisikan struktur untuk setiap sheet
    const sheets = [
      {
        name: "Bahan Baku",
        data: allData.bahanBaku,
        headers: {
          nama: "Nama Bahan", kategori: "Kategori", stok: "Stok", satuan: "Satuan",
          hargaSatuan: "Harga Satuan (Rp)", minimum: "Stok Minimum", supplier: "Supplier",
          tanggalKadaluwarsa: "Kadaluwarsa"
        }
      },
      {
        name: "Supplier",
        data: allData.suppliers,
        headers: {
          nama: "Nama Supplier", kontak: "Kontak", email: "Email",
          telepon: "Telepon", alamat: "Alamat"
        }
      },
      {
        name: "Pembelian",
        data: (allData.purchases || []).flatMap((p: any) => {
            const supplier = (allData.suppliers || []).find((s: any) => s.id === p.supplier);
            return (p.items || []).map((item: any) => ({
                ...item,
                tanggal: p.tanggal,
                supplierName: supplier?.nama || p.supplier,
                status: p.status
            }));
        }),
        headers: {
          tanggal: "Tanggal", supplierName: "Supplier", namaBarang: "Nama Barang",
          jumlah: "Jumlah", satuan: "Satuan", hargaSatuan: "Harga Satuan (Rp)",
          totalHarga: "Total Harga (Rp)", status: "Status"
        }
      },
      {
        name: "Resep",
        data: (allData.recipes || []).flatMap((r: any) => 
            (r.ingredients || []).map((ing: any) => ({
                namaResep: r.namaResep, porsi: r.porsi, namaBahan: ing.nama, jumlah: ing.jumlah,
                satuan: ing.satuan, hargaPerSatuan: ing.hargaPerSatuan, totalHargaBahan: ing.totalHarga,
                biayaTenagaKerja: r.biayaTenagaKerja, biayaOverhead: r.biayaOverhead, totalHPP: r.totalHPP,
                hppPerPorsi: r.hppPerPorsi, marginKeuntungan: r.marginKeuntungan, hargaJualPerPorsi: r.hargaJualPerPorsi
            }))
        ),
        headers: {
            namaResep: "Nama Resep", porsi: "Porsi", namaBahan: "Nama Bahan", jumlah: "Jumlah",
            satuan: "Satuan", hargaPerSatuan: "Harga Satuan Bahan (Rp)", totalHargaBahan: "Total Harga Bahan (Rp)",
            biayaTenagaKerja: "Biaya Tenaga Kerja (Rp)", biayaOverhead: "Biaya Overhead (Rp)",
            totalHPP: "Total HPP (Rp)", hppPerPorsi: "HPP per Porsi (Rp)",
            marginKeuntungan: "Margin (%)", hargaJualPerPorsi: "Harga Jual per Porsi (Rp)"
        }
      },
       {
        name: "Pesanan",
        data: (allData.orders || []).flatMap((o: any) => 
            (o.items || []).map((item: any) => ({
                ...item,
                nomorPesanan: o.nomorPesanan,
                tanggal: o.tanggal,
                namaPelanggan: o.namaPelanggan,
                totalPesanan: o.totalPesanan,
                status: o.status
            }))
        ),
        headers: {
            nomorPesanan: "Nomor Pesanan", tanggal: "Tanggal", namaPelanggan: "Nama Pelanggan",
            namaBarang: "Nama Barang", quantity: "Jumlah", hargaSatuan: "Harga Satuan (Rp)",
            totalHarga: "Total Harga (Rp)", totalPesanan: "Total Pesanan (Rp)", status: "Status"
        }
      },
      {
        name: "Aset",
        data: allData.assets,
        headers: {
            nama: "Nama Aset", kategori: "Kategori", nilaiAwal: "Nilai Awal (Rp)",
            nilaiSaatIni: "Nilai Saat Ini (Rp)", tanggalPembelian: "Tanggal Pembelian",
            kondisi: "Kondisi", lokasi: "Lokasi"
        }
      },
      {
        name: "Keuangan",
        data: allData.financialTransactions,
        headers: {
            date: "Tanggal", type: "Tipe", category: "Kategori",
            description: "Deskripsi", amount: "Jumlah (Rp)"
        }
      }
    ];

    // Loop untuk membuat setiap sheet
    sheets.forEach(sheetInfo => {
      // Hanya proses jika ada data
      if (sheetInfo.data && sheetInfo.data.length > 0) {
        const cleanedData = cleanDataForExport(sheetInfo.data, sheetInfo.headers);
        const worksheet = XLSX.utils.json_to_sheet(cleanedData);
        XLSX.utils.book_append_sheet(wb, worksheet, sheetInfo.name);
      } else {
        // Jika tidak ada data, buat sheet kosong dengan header
        const worksheet = XLSX.utils.json_to_sheet([{}], { header: Object.values(sheetInfo.headers) });
        XLSX.utils.book_append_sheet(wb, worksheet, sheetInfo.name);
      }
    });

    // Buat nama file yang dinamis
    const safeBusinessName = (businessName || 'Bisnis_Anda').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `hpp_backup_${safeBusinessName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    
    // Trigger download file
    XLSX.writeFile(wb, fileName);
    toast.success("Semua data berhasil diekspor ke Excel!");

  } catch (error) {
    console.error("Gagal mengekspor data:", error);
    toast.error("Terjadi kesalahan saat mengekspor data.");
  }
};
