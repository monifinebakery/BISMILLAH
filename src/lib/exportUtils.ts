import { toast } from 'sonner';
import { format } from 'date-fns';

// Deklarasikan XLSX agar TypeScript tidak error
declare const XLSX: any;

// Fungsi untuk membersihkan dan memformat data sebelum ekspor
const cleanDataForExport = (data: any[], headers: { [key: string]: string }) => {
  const headerKeys = Object.keys(headers);
  return data.map(row => {
    const newRow: { [key: string]: any } = {};
    for (const key of headerKeys) {
      let value = row[key];
      // Format tanggal jika ada
      if (value instanceof Date) {
        value = format(value, 'yyyy-MM-dd HH:mm:ss');
      }
      // Ubah array/objek menjadi JSON string agar mudah dibaca di Excel
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      newRow[headers[key]] = value;
    }
    return newRow;
  });
};

export const exportAllDataToExcel = (allData: any) => {
  try {
    const wb = XLSX.utils.book_new(); // Buat workbook baru

    // 1. Sheet Bahan Baku
    const bahanBakuHeaders = {
      nama: "Nama Bahan",
      kategori: "Kategori",
      stok: "Stok",
      satuan: "Satuan",
      hargaSatuan: "Harga Satuan (Rp)",
      minimum: "Stok Minimum",
      supplier: "Supplier",
      tanggalKadaluwarsa: "Kadaluwarsa"
    };
    const bahanBakuClean = cleanDataForExport(allData.bahanBaku, bahanBakuHeaders);
    const wsBahanBaku = XLSX.utils.json_to_sheet(bahanBakuClean);
    XLSX.utils.book_append_sheet(wb, wsBahanBaku, "Bahan Baku");

    // 2. Sheet Supplier
    const supplierHeaders = {
      nama: "Nama Supplier",
      kontak: "Kontak",
      email: "Email",
      telepon: "Telepon",
      alamat: "Alamat"
    };
    const suppliersClean = cleanDataForExport(allData.suppliers, supplierHeaders);
    const wsSuppliers = XLSX.utils.json_to_sheet(suppliersClean);
    XLSX.utils.book_append_sheet(wb, wsSuppliers, "Supplier");

    // 3. Sheet Pembelian (Flattened)
    const purchaseHeaders = {
      tanggal: "Tanggal",
      supplierName: "Supplier",
      namaBarang: "Nama Barang",
      jumlah: "Jumlah",
      satuan: "Satuan",
      hargaSatuan: "Harga Satuan (Rp)",
      totalHarga: "Total Harga (Rp)",
      status: "Status"
    };
    const purchasesFlat = allData.purchases.flatMap((p: any) => {
        const supplier = allData.suppliers.find((s: any) => s.id === p.supplier);
        return p.items.map((item: any) => ({
            ...item,
            tanggal: p.tanggal,
            supplierName: supplier?.nama || p.supplier,
            status: p.status
        }));
    });
    const purchasesClean = cleanDataForExport(purchasesFlat, purchaseHeaders);
    const wsPurchases = XLSX.utils.json_to_sheet(purchasesClean);
    XLSX.utils.book_append_sheet(wb, wsPurchases, "Pembelian");

    // 4. Sheet Resep (Flattened)
    const recipeHeaders = {
        namaResep: "Nama Resep",
        porsi: "Porsi",
        namaBahan: "Nama Bahan",
        jumlah: "Jumlah",
        satuan: "Satuan",
        hargaPerSatuan: "Harga Satuan Bahan (Rp)",
        totalHargaBahan: "Total Harga Bahan (Rp)",
        biayaTenagaKerja: "Biaya Tenaga Kerja (Rp)",
        biayaOverhead: "Biaya Overhead (Rp)",
        totalHPP: "Total HPP (Rp)",
        hppPerPorsi: "HPP per Porsi (Rp)",
        marginKeuntungan: "Margin (%)",
        hargaJualPerPorsi: "Harga Jual per Porsi (Rp)"
    };
    const recipesFlat = allData.recipes.flatMap((r: any) => 
        r.ingredients.map((ing: any) => ({
            namaResep: r.namaResep,
            porsi: r.porsi,
            namaBahan: ing.nama,
            jumlah: ing.jumlah,
            satuan: ing.satuan,
            hargaPerSatuan: ing.hargaPerSatuan,
            totalHargaBahan: ing.totalHarga,
            biayaTenagaKerja: r.biayaTenagaKerja,
            biayaOverhead: r.biayaOverhead,
            totalHPP: r.totalHPP,
            hppPerPorsi: r.hppPerPorsi,
            marginKeuntungan: r.marginKeuntungan,
            hargaJualPerPorsi: r.hargaJualPerPorsi
        }))
    );
    const recipesClean = cleanDataForExport(recipesFlat, recipeHeaders);
    const wsRecipes = XLSX.utils.json_to_sheet(recipesClean);
    XLSX.utils.book_append_sheet(wb, wsRecipes, "Resep");

    // 5. Sheet Pesanan (Flattened)
    const orderHeaders = {
        nomorPesanan: "Nomor Pesanan",
        tanggal: "Tanggal",
        namaPelanggan: "Nama Pelanggan",
        namaBarang: "Nama Barang",
        quantity: "Jumlah",
        hargaSatuan: "Harga Satuan (Rp)",
        totalHarga: "Total Harga (Rp)",
        totalPesanan: "Total Pesanan (Rp)",
        status: "Status"
    };
    const ordersFlat = allData.orders.flatMap((o: any) => 
        o.items.map((item: any) => ({
            ...item,
            nomorPesanan: o.nomorPesanan,
            tanggal: o.tanggal,
            namaPelanggan: o.namaPelanggan,
            totalPesanan: o.totalPesanan,
            status: o.status
        }))
    );
    const ordersClean = cleanDataForExport(ordersFlat, orderHeaders);
    const wsOrders = XLSX.utils.json_to_sheet(ordersClean);
    XLSX.utils.book_append_sheet(wb, wsOrders, "Pesanan");

    // 6. Sheet Aset
    const assetHeaders = {
        nama: "Nama Aset",
        kategori: "Kategori",
        nilaiAwal: "Nilai Awal (Rp)",
        nilaiSaatIni: "Nilai Saat Ini (Rp)",
        tanggalPembelian: "Tanggal Pembelian",
        kondisi: "Kondisi",
        lokasi: "Lokasi"
    };
    const assetsClean = cleanDataForExport(allData.assets, assetHeaders);
    const wsAssets = XLSX.utils.json_to_sheet(assetsClean);
    XLSX.utils.book_append_sheet(wb, wsAssets, "Aset");

    // 7. Sheet Keuangan
    const financialHeaders = {
        date: "Tanggal",
        type: "Tipe",
        category: "Kategori",
        description: "Deskripsi",
        amount: "Jumlah (Rp)"
    };
    const financialClean = cleanDataForExport(allData.financialTransactions, financialHeaders);
    const wsFinancial = XLSX.utils.json_to_sheet(financialClean);
    XLSX.utils.book_append_sheet(wb, wsFinancial, "Keuangan");

    // Trigger download file
    const fileName = `Export_Semua_Data_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Semua data berhasil diekspor ke Excel!");

  } catch (error) {
    console.error("Gagal mengekspor data:", error);
    toast.error("Terjadi kesalahan saat mengekspor data.");
  }
};
