// utils/exportUtils.js - Optimized with Lazy Loading
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Lazy load XLSX library hanya saat dibutuhkan
 */
const loadXLSX = async () => {
  try {
    const XLSX = await import('xlsx');
    return XLSX;
  } catch (error) {
    console.error('Failed to load XLSX library:', error);
    toast.error('Gagal memuat library Excel. Silakan coba lagi.');
    throw error;
  }
};

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
      } else if (typeof value === 'string' && value.includes('\n')) {
        // Preserve line breaks in Excel cells
        value = value.replace(/\n/g, '\r\n');
      }
      
      newRow[headers[key]] = value || '';
    }
    return newRow;
  });
};

/**
 * Convert template object to array format for Excel export
 * @param templates Object with status as key and template as value
 * @returns Array of template objects
 */
const convertTemplatesToArray = (templates: { [key: string]: string }) => {
  if (!templates || typeof templates !== 'object') {
    return [];
  }

  return Object.entries(templates).map(([status, template]) => ({
    status,
    template: template || '',
    characterCount: template ? template.length : 0,
    lineCount: template ? template.split('\n').length : 0,
    variableCount: template ? (template.match(/\{\{[^}]+\}\}/g) || []).length : 0
  }));
};

/**
 * Mengekspor semua data aplikasi ke satu file Excel dengan beberapa sheet.
 * @param allData Objek yang berisi semua array data dari konteks (bahanBaku, suppliers, dll.).
 * @param businessName Nama bisnis pengguna untuk nama file kustom.
 * @param format Format file yang diinginkan ('xlsx' | 'csv').
 */
export const exportAllDataToExcel = async (
  allData: any,
  businessName?: string,
  format: 'xlsx' | 'csv' = 'xlsx'
) => {
  // Show loading toast
  const loadingToast = toast.loading("Memuat library Excel...");

  try {
    // Lazy load XLSX
    const XLSX = await loadXLSX();

    // Update loading message
    toast.loading("Memproses data untuk ekspor...", { id: loadingToast });

    // Definisikan struktur untuk setiap sheet
    const sheets = [
      {
        name: "Gudang Bahan Baku",
        data: allData.bahanBaku,
        headers: {
          nama: "Nama Bahan",
          kategori: "Kategori",
          stok: "Stok",
          satuan: "Satuan",
          hargaSatuan: "Harga Satuan (Rp)",
          minimum: "Stok Minimum",
          supplier: "Supplier",
          tanggalKadaluwarsa: "Kadaluwarsa"
        }
      },
      {
        name: "Supplier",
        data: allData.suppliers,
        headers: {
          nama: "Nama Supplier",
          kontak: "Kontak",
          email: "Email",
          telepon: "Telepon",
          alamat: "Alamat"
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
          tanggal: "Tanggal",
          supplierName: "Supplier",
          namaBarang: "Nama Barang",
          jumlah: "Jumlah",
          satuan: "Satuan",
          hargaSatuan: "Harga Satuan (Rp)",
          totalHarga: "Total Harga (Rp)",
          status: "Status"
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
            teleponPelanggan: o.teleponPelanggan,
            alamatPengiriman: o.alamatPengiriman,
            totalPesanan: o.totalPesanan,
            status: o.status,
            catatan: o.catatan
          }))
        ),
        headers: {
          nomorPesanan: "Nomor Pesanan",
          tanggal: "Tanggal",
          namaPelanggan: "Nama Pelanggan",
          teleponPelanggan: "Telepon Pelanggan",
          alamatPengiriman: "Alamat Pengiriman",
          namaBarang: "Nama Barang",
          quantity: "Jumlah",
          hargaSatuan: "Harga Satuan (Rp)",
          totalHarga: "Total Harga (Rp)",
          totalPesanan: "Total Pesanan (Rp)",
          status: "Status",
          catatan: "Catatan"
        }
      },
      {
        name: "Manajemen Resep",
        data: allData.recipes,
        headers: {
          namaResep: "Nama Resep",
          jumlahPorsi: "Jumlah Porsi",
          kategoriResep: "Kategori",
          deskripsi: "Deskripsi",
          bahanResep: "Bahan Resep",
          biayaTenagaKerja: "Biaya Tenaga Kerja (Rp)",
          biayaOverhead: "Biaya Overhead (Rp)",
          marginKeuntunganPersen: "Margin (%)",
          totalHpp: "Total HPP (Rp)",
          hppPerPorsi: "HPP per Porsi (Rp)",
          hargaJualPorsi: "Harga Jual per Porsi (Rp)",
          jumlahPcsPerPorsi: "Jumlah Pcs per Porsi",
          hppPerPcs: "HPP per Pcs (Rp)",
          hargaJualPerPcs: "Harga Jual per Pcs (Rp)"
        }
      },
      {
        name: "Hitung HPP",
        data: allData.hppResults,
        headers: {
          nama: "Nama",
          ingredients: "Bahan",
          biayaTenagaKerja: "Biaya Tenaga Kerja (Rp)",
          biayaOverhead: "Biaya Overhead (Rp)",
          marginKeuntungan: "Margin Keuntungan (%)",
          totalHPP: "Total HPP (Rp)",
          hppPerPorsi: "HPP per Porsi (Rp)",
          hargaJualPorsi: "Harga Jual per Porsi (Rp)",
          jumlahPorsi: "Jumlah Porsi"
        }
      },
      {
        name: "Kalkulator Promo",
        data: allData.promos,
        headers: {
          namaPromo: "Nama Promo",
          tipePromo: "Tipe Promo",
          status: "Status",
          dataPromo: "Data Promo",
          calculationResult: "Hasil Kalkulasi",
          tanggalMulai: "Tanggal Mulai",
          tanggalSelesai: "Tanggal Selesai",
          deskripsi: "Deskripsi",
          createdAt: "Dibuat",
          updatedAt: "Diperbarui"
        }
      },
      {
        name: "Biaya Operasional",
        data: (() => {
          const costs = (allData.operationalCosts || []).map((c: any) => ({
            type: "Biaya",
            namaBiaya: c.nama_biaya || c.namaBiaya,
            jumlahPerBulan: c.jumlah_per_bulan || c.jumlahPerBulan,
            jenis: c.jenis,
            status: c.status,
            metode: "",
            nilai: "",
            createdAt: c.created_at || c.createdAt,
            updatedAt: c.updated_at || c.updatedAt
          }));
          const allocation = allData.allocationSettings
            ? [{
                type: "Pengaturan Alokasi",
                namaBiaya: "",
                jumlahPerBulan: "",
                jenis: "",
                status: "",
                metode: allData.allocationSettings.metode,
                nilai: allData.allocationSettings.nilai,
                createdAt: allData.allocationSettings.created_at || allData.allocationSettings.createdAt,
                updatedAt: allData.allocationSettings.updated_at || allData.allocationSettings.updatedAt
              }]
            : [];
          return [...costs, ...allocation];
        })(),
        headers: {
          type: "Tipe",
          namaBiaya: "Nama Biaya",
          jumlahPerBulan: "Jumlah per Bulan (Rp)",
          jenis: "Jenis",
          status: "Status",
          metode: "Metode Alokasi",
          nilai: "Nilai Alokasi",
          createdAt: "Dibuat",
          updatedAt: "Diperbarui"
        }
      },
      {
        name: "Bisnis",
        data: allData.activities,
        headers: {
          title: "Judul",
          description: "Deskripsi",
          type: "Tipe",
          value: "Nilai",
          timestamp: "Timestamp",
          createdAt: "Dibuat",
          updatedAt: "Diperbarui"
        }
      },
      {
        name: "Laporan Keuangan",
        data: allData.financialTransactions,
        headers: {
          date: "Tanggal",
          type: "Tipe",
          category: "Kategori",
          description: "Deskripsi",
          amount: "Jumlah (Rp)"
        }
      },
      {
        name: "Analisis Profit",
        data: (() => {
          const analyses: any[] = [];
          if (allData.profitAnalysis) {
            analyses.push(allData.profitAnalysis);
          }
          if (Array.isArray(allData.profitHistory)) {
            analyses.push(...allData.profitHistory);
          }
          return analyses.map((p: any) => {
            const revenue = p.total_revenue ?? p.revenue_data?.total ?? 0;
            const cogs = p.total_cogs ?? p.cogs_data?.total ?? 0;
            const opex = p.total_opex ?? p.opex_data?.total ?? 0;
            const gross = p.gross_profit ?? (revenue - cogs);
            const net = p.net_profit ?? (gross - opex);
            const grossMargin = p.gross_margin ?? (revenue ? (gross / revenue) * 100 : 0);
            const netMargin = p.net_margin ?? (revenue ? (net / revenue) * 100 : 0);
            return {
              period: p.period,
              total_revenue: revenue,
              total_cogs: cogs,
              total_opex: opex,
              gross_profit: gross,
              net_profit: net,
              gross_margin: grossMargin,
              net_margin: netMargin,
              calculation_date: p.calculation_date || p.calculated_at
            };
          });
        })(),
        headers: {
          period: "Periode",
          total_revenue: "Total Pendapatan (Rp)",
          total_cogs: "Total HPP (Rp)",
          total_opex: "Total Biaya Operasional (Rp)",
          gross_profit: "Laba Kotor (Rp)",
          net_profit: "Laba Bersih (Rp)",
          gross_margin: "Margin Kotor (%)",
          net_margin: "Margin Bersih (%)",
          calculation_date: "Tanggal Perhitungan"
        }
      },
      {
        name: "Manajemen Aset",
        data: allData.assets,
        headers: {
          nama: "Nama Aset",
          kategori: "Kategori",
          nilaiAwal: "Nilai Awal (Rp)",
          nilaiSaatIni: "Nilai Saat Ini (Rp)",
          tanggalPembelian: "Tanggal Pembelian",
          kondisi: "Kondisi",
          lokasi: "Lokasi"
        }
      },
      {
        name: "Invoice",
        data: (allData.invoices || []).map((inv: any) => ({
          invoiceNumber: inv.invoiceNumber,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          status: inv.status,
          customerName: inv.customer?.name,
          customerAddress: inv.customer?.address,
          customerPhone: inv.customer?.phone,
          customerEmail: inv.customer?.email,
          items: inv.items,
          discount: inv.discount?.value,
          tax: inv.tax?.value,
          shipping: inv.shipping,
          notes: inv.notes,
          paymentInstructions: inv.paymentInstructions
        })),
        headers: {
          invoiceNumber: "Nomor Invoice",
          issueDate: "Tanggal Diterbitkan",
          dueDate: "Jatuh Tempo",
          status: "Status",
          customerName: "Nama Pelanggan",
          customerAddress: "Alamat Pelanggan",
          customerPhone: "Telepon Pelanggan",
          customerEmail: "Email Pelanggan",
          items: "Item",
          discount: "Diskon",
          tax: "Pajak",
          shipping: "Biaya Pengiriman",
          notes: "Catatan",
          paymentInstructions: "Instruksi Pembayaran"
        }
      },
      {
        name: "Template WhatsApp",
        data: convertTemplatesToArray(allData.whatsappTemplates || {}),
        headers: {
          status: "Status Pesanan",
          template: "Template Pesan",
          characterCount: "Jumlah Karakter",
          lineCount: "Jumlah Baris",
          variableCount: "Jumlah Variabel"
        }
      }
    ];

    // Buat nama file dasar yang dinamis
    const safeBusinessName = (businessName || 'Bisnis_Anda')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const baseFileName = `hpp_backup_${safeBusinessName}_${dateStr}`;

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();

      // Loop untuk membuat setiap sheet
      sheets.forEach(sheetInfo => {
        if (sheetInfo.data && sheetInfo.data.length > 0) {
          const cleanedData = cleanDataForExport(sheetInfo.data, sheetInfo.headers);
          const worksheet = XLSX.utils.json_to_sheet(cleanedData);

          if (sheetInfo.name === "Template WhatsApp") {
            const colWidths = [
              { wch: 15 },
              { wch: 60 },
              { wch: 12 },
              { wch: 10 },
              { wch: 12 }
            ];
            worksheet['!cols'] = colWidths;
          }

          XLSX.utils.book_append_sheet(wb, worksheet, sheetInfo.name);
        } else {
          const emptyData = [Object.keys(sheetInfo.headers).reduce((acc, key) => {
            acc[sheetInfo.headers[key]] = '';
            return acc;
          }, {} as any)];

          const worksheet = XLSX.utils.json_to_sheet(emptyData);
          XLSX.utils.book_append_sheet(wb, worksheet, sheetInfo.name);
        }
      });

      // Update loading message
      toast.loading("Mengunduh file...", { id: loadingToast });
      XLSX.writeFile(wb, `${baseFileName}.xlsx`);
    } else {
      // Export tiap sheet sebagai CSV terpisah
      toast.loading("Mengunduh file...", { id: loadingToast });
      sheets.forEach(sheetInfo => {
        let worksheet;
        if (sheetInfo.data && sheetInfo.data.length > 0) {
          const cleanedData = cleanDataForExport(sheetInfo.data, sheetInfo.headers);
          worksheet = XLSX.utils.json_to_sheet(cleanedData);
        } else {
          const emptyData = [Object.keys(sheetInfo.headers).reduce((acc, key) => {
            acc[sheetInfo.headers[key]] = '';
            return acc;
          }, {} as any)];
          worksheet = XLSX.utils.json_to_sheet(emptyData);
        }

        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const safeSheetName = sheetInfo.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.href = URL.createObjectURL(blob);
        link.download = `${baseFileName}_${safeSheetName}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      });
    }

    // Dismiss loading and show success
    toast.dismiss(loadingToast);
    toast.success(`Semua data berhasil diekspor ke ${format.toUpperCase()}!`);

  } catch (error) {
    console.error("Gagal mengekspor data:", error);
    toast.dismiss(loadingToast);
    toast.error("Terjadi kesalahan saat mengekspor data.");
  }
};

/**
 * Export hanya template WhatsApp ke Excel
 * @param templates Object berisi template WhatsApp per status
 * @param businessName Nama bisnis untuk filename
 */
export const exportWhatsAppTemplates = async (templates: { [key: string]: string }, businessName?: string) => {
  const loadingToast = toast.loading("Memuat library Excel...");
  
  try {
    // Lazy load XLSX
    const XLSX = await loadXLSX();
    
    toast.loading("Memproses template...", { id: loadingToast });
    
    const wb = XLSX.utils.book_new();
    
    // Convert templates to array format
    const templateData = convertTemplatesToArray(templates);
    
    if (templateData.length === 0) {
      toast.dismiss(loadingToast);
      toast.warning("Tidak ada template untuk diekspor");
      return;
    }

    const headers = {
      status: "Status Pesanan",
      template: "Template Pesan",
      characterCount: "Jumlah Karakter",
      lineCount: "Jumlah Baris",
      variableCount: "Jumlah Variabel"
    };

    const cleanedData = cleanDataForExport(templateData, headers);
    const worksheet = XLSX.utils.json_to_sheet(cleanedData);
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // Status
      { wch: 80 }, // Template (extra wide for long templates)
      { wch: 12 }, // Character Count
      { wch: 10 }, // Line Count
      { wch: 12 }  // Variable Count
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, worksheet, "Template WhatsApp");

    // Add instruction sheet
    const instructionData = [
      { 
        "Kolom": "Status Pesanan", 
        "Deskripsi": "Status pesanan (pending, confirmed, shipping, delivered, cancelled)" 
      },
      { 
        "Kolom": "Template Pesan", 
        "Deskripsi": "Template pesan WhatsApp dengan variabel" 
      },
      { 
        "Kolom": "Jumlah Karakter", 
        "Deskripsi": "Total karakter dalam template" 
      },
      { 
        "Kolom": "Jumlah Baris", 
        "Deskripsi": "Total baris dalam template" 
      },
      { 
        "Kolom": "Jumlah Variabel", 
        "Deskripsi": "Jumlah variabel {{variabel}} dalam template" 
      },
      { 
        "Kolom": "", 
        "Deskripsi": "" 
      },
      { 
        "Kolom": "Variabel Tersedia:", 
        "Deskripsi": "{{namaPelanggan}}, {{nomorPesanan}}, {{teleponPelanggan}}" 
      },
      { 
        "Kolom": "", 
        "Deskripsi": "{{tanggal}}, {{totalPesanan}}, {{items}}" 
      },
      { 
        "Kolom": "", 
        "Deskripsi": "{{alamatPengiriman}}, {{catatan}}" 
      }
    ];

    const instructionSheet = XLSX.utils.json_to_sheet(instructionData);
    instructionSheet['!cols'] = [{ wch: 20 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, instructionSheet, "Petunjuk");

    // Generate filename
    const safeBusinessName = (businessName || 'Bisnis_Anda').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `template_whatsapp_${safeBusinessName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    
    toast.loading("Mengunduh file...", { id: loadingToast });
    
    XLSX.writeFile(wb, fileName);
    
    toast.dismiss(loadingToast);
    toast.success("Template WhatsApp berhasil diekspor ke Excel!");

  } catch (error) {
    console.error("Gagal mengekspor template WhatsApp:", error);
    toast.dismiss(loadingToast);
    toast.error("Terjadi kesalahan saat mengekspor template.");
  }
};

/**
 * Import template WhatsApp dari Excel file
 * @param file Excel file yang di-upload
 * @param onSuccess Callback ketika import berhasil
 */
export const importWhatsAppTemplates = async (file: File, onSuccess: (templates: { [key: string]: string }) => void) => {
  const loadingToast = toast.loading("Memuat library Excel...");
  
  try {
    // Lazy load XLSX
    const XLSX = await loadXLSX();
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        toast.loading("Memproses file Excel...", { id: loadingToast });
        
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('template') || name.toLowerCase().includes('whatsapp')
        ) || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const templates: { [key: string]: string } = {};
        let importCount = 0;
        
        jsonData.forEach((row: any) => {
          const status = row['Status Pesanan'] || row['status'];
          const template = row['Template Pesan'] || row['template'];
          
          if (status && template) {
            templates[status] = template;
            importCount++;
          }
        });
        
        toast.dismiss(loadingToast);
        
        if (importCount > 0) {
          onSuccess(templates);
          toast.success(`${importCount} template berhasil diimpor dari Excel!`);
        } else {
          toast.warning("Tidak ada template valid yang ditemukan dalam file Excel");
        }
        
      } catch (parseError) {
        console.error("Error parsing Excel file:", parseError);
        toast.dismiss(loadingToast);
        toast.error("File Excel tidak dapat dibaca. Pastikan format file benar.");
      }
    };
    
    reader.onerror = () => {
      toast.dismiss(loadingToast);
      toast.error("Gagal membaca file Excel");
    };
    
    reader.readAsArrayBuffer(file);
    
  } catch (error) {
    console.error("Error importing templates:", error);
    toast.dismiss(loadingToast);
    toast.error("Terjadi kesalahan saat mengimpor template");
  }
};