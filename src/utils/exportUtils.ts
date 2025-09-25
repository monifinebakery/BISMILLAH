// utils/exportUtils.js - Optimized with Lazy Loading
import { toast } from 'sonner';
import { format } from 'date-fns';
import { safeCalculateMargins } from './profitValidation';
import { formatCurrency } from '@/lib/shared/formatters';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { getStatusText } from '@/components/orders/constants';

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
const cleanDataForExport = (data: any[], headers: any) => {
  if (!data || !Array.isArray(data)) {
    return []; // Kembalikan array kosong jika data tidak valid
  }

  const headerKeys = Object.keys(headers);
  return data.map(row => {
    const newRow: Record<string, any> = {};
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
 * Setiap dataset ditulis ke sheet terpisah dengan kolom sesuai mapping `headers`:
 * - "Bahan Baku": Nama Bahan, Kategori, Stok, Satuan, Harga Satuan (Rp), Stok Minimum, Supplier, Kadaluwarsa
 * - "Supplier": Nama Supplier, Kontak, Email, Telepon, Alamat
 * - "Pembelian": Tanggal, Supplier, Nama Barang, Jumlah, Satuan, Harga Satuan (Rp), Total Harga (Rp), Status
 * - "Resep": Nama Resep, Porsi, Nama Bahan, Jumlah, Satuan, Harga Satuan Bahan (Rp), Total Harga Bahan (Rp),
 *            Biaya Tenaga Kerja (Rp), Biaya Overhead (Rp), Total HPP (Rp), HPP per Porsi (Rp),
 *            Margin (%), Harga Jual per Porsi (Rp)
 * - "Pesanan": Nomor Pesanan, Tanggal, Nama Pelanggan, Telepon Pelanggan, Alamat Pengiriman,
 *              Nama Barang, Jumlah, Harga Satuan (Rp), Total Harga (Rp), Total Pesanan (Rp), Status, Catatan
 * - "Template WhatsApp": Status Pesanan, Template Pesan, Jumlah Karakter, Jumlah Baris, Jumlah Variabel
 * - "Aset": Nama Aset, Kategori, Nilai Awal (Rp), Nilai Saat Ini (Rp), Tanggal Pembelian, Kondisi, Lokasi
 * - "Keuangan": Tanggal, Tipe, Kategori, Deskripsi, Jumlah (Rp)
 * @param allData Objek yang berisi semua array data dari konteks (bahanBaku, suppliers, dll.).
 * @param businessName Nama bisnis pengguna untuk nama file kustom.
 * @param fileFormat Format file yang diinginkan ('xlsx' | 'csv').
 */
export const exportAllDataToExcel = async (
  allData: any,
  businessName?: string,
  fileFormat: 'xlsx' | 'csv' = 'xlsx'
) => {
  // Show loading toast
  const loadingToast = toast.loading("Memuat library Excel...");

  try {
    // Lazy load XLSX
    const XLSX = await loadXLSX();

    // Create new workbook
    const wb = XLSX.utils.book_new();

    // Generate safe filename
    const safeBusinessName = (businessName || 'bisnis_anda')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const fileName = `semua_data_${safeBusinessName}_${format(new Date(), 'yyyy-MM-dd')}.${fileFormat}`;

    // Update loading message
    toast.loading("Memproses data untuk ekspor...", { id: loadingToast });

    // Definisikan struktur untuk setiap sheet dan kolom yang akan diekspor.
    // Urutan objek `headers` menentukan urutan kolom di file Excel.
    const sheets = [
      {
        name: "Gudang Bahan Baku",
        data: (allData.bahanBaku || []).map((item: any) => ({
          ...item,
          hargaSatuan: item.hargaSatuan ? formatCurrency(item.hargaSatuan) : formatCurrency(0),
          minimum: item.minimum || 0,
          stok: item.stok || 0
        })),
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
          return (p.items || []).map((item: any) => ({
            ...item,
            tanggal: p.tanggal ? formatDateForDisplay(p.tanggal) : '',
            supplierName: p.supplier || 'Supplier Tidak Dikenal',
            status: p.status,
            hargaSatuan: formatCurrency(Number(item.hargaSatuan ?? item.harga_satuan ?? 0)),
            totalHarga: formatCurrency(Number(item.totalHarga ?? item.total_harga ?? 0))
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
            nomorPesanan: o.nomorPesanan ?? o.order_number ?? o.nomor_pesanan,
            tanggal: o.tanggal ? formatDateForDisplay(o.tanggal) : '',
            namaPelanggan: o.namaPelanggan ?? o.customer_name,
            teleponPelanggan: o.teleponPelanggan ?? o.customer_phone,
            alamatPengiriman: o.alamatPengiriman ?? o.alamat_pengiriman,
            totalPesanan: formatCurrency(Number(o.totalPesanan ?? o.total_amount ?? o.total_pesanan ?? 0)),
            status: getStatusText((o.status ?? 'pending') as any),
            catatan: o.catatan,
            hargaSatuan: formatCurrency(Number(item.hargaSatuan ?? item.price ?? 0)),
            totalHarga: formatCurrency(Number(item.totalHarga ?? item.total ?? ((item.quantity || 0) * (item.price || 0))))
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
        data: (allData.recipes || []).map((recipe: any) => {
          const supplierList = Array.isArray(allData.suppliers) ? allData.suppliers : [];
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const resolveSupplier = (b: any) => {
            const raw = b?.supplier_name ?? b?.supplierName ?? b?.supplier ?? b?.supplier_id ?? b?.supplierId ?? '';
            if (!raw) return '';
            if (typeof raw === 'string' && !uuidRegex.test(raw)) return raw;
            const id = String(raw);
            const found = supplierList.find((s: any) => s.id === id);
            return found?.nama || id;
          };

          let bahanResepText = '';
          const list = recipe.bahanResep || recipe.bahan_resep || [];
          if (Array.isArray(list)) {
            bahanResepText = list.map((b: any) => {
              const supplierName = resolveSupplier(b);
              const base = `${b.nama} (${b.jumlah} ${b.satuan})`;
              return supplierName ? `${base} [Supplier: ${supplierName}]` : base;
            }).join(', ');
          }
          
          return {
            ...recipe,
            bahanResep: bahanResepText
          };
        }),
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
        data: (allData.hppResults || []).map((hpp: any) => {
          // Process ingredients to make it readable
          let ingredientsText = '';
          if (hpp.ingredients && Array.isArray(hpp.ingredients)) {
            ingredientsText = hpp.ingredients.map((i: any) => 
              `${i.name} (${i.quantity} ${i.unit}) - ${formatCurrency(i.price || 0)}`
            ).join(', ');
          }
          
          return {
            ...hpp,
            ingredients: ingredientsText
          };
        }),
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
        data: (allData.promos || []).map((promo: any) => {
          // Format data promo and calculation result for better readability
          let dataPromoText = '';
          if (promo.dataPromo) {
            if (typeof promo.dataPromo === 'object') {
              dataPromoText = JSON.stringify(promo.dataPromo);
            } else {
              dataPromoText = String(promo.dataPromo);
            }
          }
          
          let calculationResultText = '';
          if (promo.calculationResult) {
            if (typeof promo.calculationResult === 'object') {
              calculationResultText = JSON.stringify(promo.calculationResult);
            } else {
              calculationResultText = String(promo.calculationResult);
            }
          }
          
          return {
            ...promo,
            dataPromo: dataPromoText,
            calculationResult: calculationResultText
          };
        }),
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
            jumlahPerBulan: c.jumlah_per_bulan || c.jumlahPerBulan ? 
              formatCurrency(c.jumlah_per_bulan || c.jumlahPerBulan) : formatCurrency(0),
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
        data: (allData.activities || []).map((activity: any) => ({
          ...activity,
          value: formatCurrency(activity.value || 0)
        })),
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
        data: (allData.financialTransactions || []).map((transaction: any) => ({
          ...transaction,
          amount: formatCurrency(transaction.amount || 0)
        })),
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
            
            // ✅ IMPROVED: Use centralized calculation for consistency
            const margins = safeCalculateMargins(revenue, cogs, opex);
            
            return {
              period: p.period,
              total_revenue: formatCurrency(revenue || 0),
              total_cogs: formatCurrency(cogs || 0),
              total_opex: formatCurrency(opex || 0),
              gross_profit: formatCurrency(Math.round(margins.grossProfit || 0)),
              net_profit: formatCurrency(Math.round(margins.netProfit || 0)),
              gross_margin: `${(margins.grossMargin * 100).toFixed(2)}%`,
              net_margin: `${(margins.netMargin * 100).toFixed(2)}%`,
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
        data: (allData.assets || []).map((asset: any) => ({
          ...asset,
          nilaiAwal: formatCurrency(asset.nilaiAwal || 0),
          nilaiSaatIni: formatCurrency(asset.nilaiSaatIni || 0)
        })),
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

    // Loop untuk membuat setiap sheet
    sheets.forEach(sheetInfo => {
      const headerOrder = Object.values(sheetInfo.headers);
      // Hanya proses jika ada data
      if (sheetInfo.data && sheetInfo.data.length > 0) {
        const cleanedData = cleanDataForExport(sheetInfo.data, sheetInfo.headers);
        const worksheet = XLSX.utils.json_to_sheet(cleanedData, { header: headerOrder });
        
        // Set column widths for better readability
        if (sheetInfo.name === "Template WhatsApp") {
          const colWidths = [
            { wch: 15 }, // Status
            { wch: 60 }, // Template (wider for long text)
            { wch: 12 }, // Character Count
            { wch: 10 }, // Line Count
            { wch: 12 }  // Variable Count
          ];
          worksheet['!cols'] = colWidths;
        }
        
        XLSX.utils.book_append_sheet(wb, worksheet, sheetInfo.name);
      } else {
        // Jika tidak ada data, buat sheet kosong dengan header
        const emptyRow = headerOrder.reduce((acc, header) => {
          acc[header] = '';
          return acc;
        }, {} as any);
        const worksheet = XLSX.utils.json_to_sheet([emptyRow], { header: headerOrder });
        XLSX.utils.book_append_sheet(wb, worksheet, sheetInfo.name);
      }
    });

    // Write file
    toast.loading("Mengunduh file...", { id: loadingToast });
    XLSX.writeFile(wb, fileName, { bookType: fileFormat });

    // Dismiss loading and show success
    toast.dismiss(loadingToast);
    toast.success(`Semua data berhasil diekspor ke ${fileFormat.toUpperCase()}!`);

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