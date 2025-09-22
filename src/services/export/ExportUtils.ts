// src/services/export/ExportUtils.ts
// Global CSV sheet builders (single source for headers/rows across modules)

import { formatCurrency } from '@/lib/shared/formatters';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { getStatusText } from '@/components/orders/constants';
// Local binding for recipe sheet (needed for inclusion in ExportUtils object)
import { exportRecipesToCSV as sheetRecipesCSV } from '@/components/recipe/services/recipeUtils';

export type Row = Array<string | number>;

const csv = (rows: Row[]): string =>
  rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

// 1) Warehouse - Gudang Bahan Baku (bahan_baku)
export const sheetWarehouseCSV = (items: any[] = []): string => {
  const headers = [
    'Nama', 'Kategori', 'Satuan', 'Stok', 'Minimum',
    'Harga Satuan (Rp)', 'Harga Rata-rata (Rp)', 'Supplier', 'Kadaluwarsa', 'Dibuat'
  ];
  const rows: Row[] = [headers];
  for (const x of items) {
    rows.push([
      x.nama ?? '',
      x.kategori ?? '',
      x.satuan ?? '',
      String(x.stok ?? 0),
      String(x.minimum ?? 0),
      formatCurrency(Number(x.harga_satuan ?? 0)),
      x.harga_rata_rata != null ? formatCurrency(Number(x.harga_rata_rata)) : '',
      x.supplier ?? '',
      x.tanggal_kadaluwarsa ? formatDateForDisplay(x.tanggal_kadaluwarsa) : '',
      x.created_at ? formatDateForDisplay(x.created_at) : '',
    ]);
  }
  return csv(rows);
};

// 2) Supplier
export const sheetSuppliersCSV = (items: any[] = []): string => {
  const headers = ['Nama', 'Kontak', 'Email', 'Telepon', 'Alamat', 'Catatan', 'Dibuat'];
  const rows: Row[] = [headers];
  for (const s of items) {
    rows.push([
      s.nama ?? '',
      s.kontak ?? '',
      s.email ?? '',
      s.telepon ?? '',
      s.alamat ?? '',
      s.catatan ?? '',
      s.created_at ? formatDateForDisplay(s.created_at) : '',
    ]);
  }
  return csv(rows);
};

// 3) Pembelian (purchases)
export const sheetPurchasesCSV = (items: any[] = []): string => {
  const headers = [
    'Tanggal', 'Supplier', 'Total Nilai (Rp)', 'Status', 'Jumlah Item', 'Catatan', 'Dibuat'
  ];
  const rows: Row[] = [headers];
  for (const p of items) {
    const itemCount = Array.isArray(p.items) ? p.items.length : (p.jumlah_item ?? '');
    rows.push([
      p.tanggal ? formatDateForDisplay(p.tanggal) : '',
      p.supplier ?? '',
      formatCurrency(Number(p.total_nilai ?? 0)),
      p.status ?? '',
      String(itemCount ?? ''),
      p.catatan ?? '',
      p.created_at ? formatDateForDisplay(p.created_at) : '',
    ]);
  }
  return csv(rows);
};

// 4) Pesanan (orders) — per item rows as requested
export const sheetOrdersCSV = (orders: any[] = []): string => {
  const headers = [
    'Nomor Pesanan', 'Tanggal', 'Nama Pelanggan', 'Telepon Pelanggan', 'Alamat Pengiriman',
    'Nama Barang', 'Jumlah', 'Harga Satuan', 'Total Harga', 'Total Pesanan', 'Status', 'Catatan'
  ];
  const rows: Row[] = [headers];
  for (const o of orders) {
    const nomor = o.order_number ?? o.nomor_pesanan ?? '';
    const tanggal = o.tanggal ? formatDateForDisplay(o.tanggal) : '';
    const nama = o.customer_name ?? o.nama_pelanggan ?? '';
    const telp = o.customer_phone ?? o.telepon_pelanggan ?? '';
    const alamat = o.alamat_pengiriman ?? '';
    const totalPesanan = formatCurrency(Number(o.total_amount ?? o.total_pesanan ?? 0));
    const status = getStatusText((o.status ?? 'pending') as any);
    const catatan = o.catatan ?? '';

    if (!Array.isArray(o.items) || o.items.length === 0) {
      rows.push([nomor, tanggal, nama, telp, alamat, '', '', '', '', totalPesanan, status, catatan]);
      continue;
    }

    for (const it of o.items) {
      rows.push([
        nomor,
        tanggal,
        nama,
        telp,
        alamat,
        it.name ?? '',
        String(it.quantity ?? 0),
        formatCurrency(Number(it.price ?? 0)),
        formatCurrency(Number(it.total ?? ((it.quantity || 0) * (it.price || 0)))),
        totalPesanan,
        status,
        catatan,
      ]);
    }
  }
  return csv(rows);
};

// 5) Manajemen Resep (will reuse recipe export)
// Re-export for direct usage if desired
export { exportRecipesToCSV as sheetRecipesCSV } from '@/components/recipe/services/recipeUtils';

// 5b) Hitung HPP - Detailed breakdown (ingredients + cost steps per recipe)
export const sheetHPPBreakdownCSV = (recipes: any[] = [], suppliers: any[] = []): string => {
  const headers = [
    'Nama Resep',
    'Jumlah Porsi',
    'Tipe', // Bahan | Biaya | Ringkasan
    'Nama', // Bahan name or cost item name
    'Qty',
    'Satuan',
    'Harga Satuan (Rp)',
    'Total (Rp)',
    'Supplier',
    'Keterangan',
    'HPP per Porsi (Rp)',
    'HPP per Pcs (Rp)',
    'Jumlah Pcs per Porsi',
    'Harga Jual per Porsi (Rp)',
    'Harga Jual per Pcs (Rp)',
    'Margin (%)',
  ];

  const rows: Row[] = [headers];

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const supplierNameById = new Map<string, string>();
  suppliers.forEach((s: any) => { if (s?.id) supplierNameById.set(String(s.id), s.nama || s.name || ''); });

  const resolveSupplierName = (bahan: any): string => {
    const raw = bahan?.supplier_name ?? bahan?.supplierName ?? bahan?.supplier ?? bahan?.supplier_id ?? bahan?.supplierId ?? '';
    if (!raw) return '';
    if (typeof raw === 'string' && !uuidRegex.test(raw)) return raw;
    const id = String(raw);
    return supplierNameById.get(id) || id;
  };

  for (const r of recipes) {
    const nama = r.nama_resep ?? r.namaResep ?? '';
    const porsi = Number(r.jumlah_porsi ?? r.jumlahPorsi ?? 0) || 0;
    const pcsPerPorsi = Number(r.jumlah_pcs_per_porsi ?? r.jumlahPcsPerPorsi ?? 0) || 0;
    const margin = Number(r.margin_keuntungan_persen ?? r.marginKeuntunganPersen ?? 0) || 0;
    const biayaTKL = Number(r.biaya_tenaga_kerja ?? r.biayaTenagaKerja ?? 0) || 0;
    const biayaOverhead = Number(r.biaya_overhead ?? r.biayaOverhead ?? 0) || 0;
    const hargaJualPorsi = Number(r.harga_jual_porsi ?? r.hargaJualPorsi ?? 0) || 0;
    const hargaJualPcs = Number(r.harga_jual_per_pcs ?? r.hargaJualPerPcs ?? 0) || 0;
    const hppPerPorsi = Number(r.hpp_per_porsi ?? r.hppPerPorsi ?? 0) || 0;
    const hppPerPcs = Number(r.hpp_per_pcs ?? r.hppPerPcs ?? 0) || 0;

    const bahanList: any[] = Array.isArray(r.bahan_resep ?? r.bahanResep) ? (r.bahan_resep ?? r.bahanResep) : [];

    // Ingredients rows
    let totalBahanBaku = 0;
    for (const b of bahanList) {
      const qty = Number(b.jumlah ?? 0) || 0;
      const satuan = b.satuan ?? '';
      const hargaSatuan = Number(b.harga_satuan ?? b.hargaSatuan ?? 0) || 0;
      const total = Number(b.total_harga ?? b.totalHarga ?? (qty * hargaSatuan)) || 0;
      totalBahanBaku += total;
      rows.push([
        nama,
        String(porsi),
        'Bahan',
        b.nama ?? '',
        String(qty),
        satuan,
        formatCurrency(hargaSatuan),
        formatCurrency(total),
        resolveSupplierName(b),
        '',
        '', '', String(pcsPerPorsi || ''), '', '', String(margin || ''),
      ]);
    }

    // Cost rows
    rows.push([
      nama,
      String(porsi),
      'Biaya',
      'Tenaga Kerja',
      '',
      '',
      '',
      formatCurrency(biayaTKL),
      '',
      '',
      '', '', String(pcsPerPorsi || ''), '', '', String(margin || ''),
    ]);
    rows.push([
      nama,
      String(porsi),
      'Biaya',
      'Overhead',
      '',
      '',
      '',
      formatCurrency(biayaOverhead),
      '',
      '',
      '', '', String(pcsPerPorsi || ''), '', '', String(margin || ''),
    ]);

    const totalHPP = totalBahanBaku + biayaTKL + biayaOverhead;

    // Summary row
    rows.push([
      nama,
      String(porsi),
      'Ringkasan',
      'TOTAL',
      '',
      '',
      '',
      formatCurrency(totalHPP),
      '',
      `Total Bahan: ${formatCurrency(totalBahanBaku)}`,
      formatCurrency(hppPerPorsi || (porsi > 0 ? totalHPP / porsi : 0)),
      formatCurrency(hppPerPcs || (porsi > 0 && pcsPerPorsi > 0 ? (totalHPP / porsi) / pcsPerPorsi : 0)),
      String(pcsPerPorsi || ''),
      formatCurrency(hargaJualPorsi),
      formatCurrency(hargaJualPcs),
      String(margin || ''),
    ]);
  }

  return csv(rows);
};

// 6) Biaya Operasional
export const sheetOperationalCostsCSV = (items: any[] = []): string => {
  const headers = [
    'Nama Biaya', 'Jenis', 'Jumlah per Bulan (Rp)', 'Status', 'Kelompok', 'Kategori', 'Efektif', 'Dibuat'
  ];
  const rows: Row[] = [headers];
  for (const c of items) {
    rows.push([
      c.nama_biaya ?? '',
      c.jenis ?? '',
      formatCurrency(Number(c.jumlah_per_bulan ?? 0)),
      c.status ?? '',
      c.group ?? '',
      c.cost_category ?? '',
      c.effective_date ? formatDateForDisplay(c.effective_date) : '',
      c.created_at ? formatDateForDisplay(c.created_at) : '',
    ]);
  }
  return csv(rows);
};

// 7) Laporan Keuangan (financial_transactions)
export const sheetFinancialTransactionsCSV = (items: any[] = []): string => {
  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah (Rp)', 'Deskripsi', 'Terkait ID'];
  const rows: Row[] = [headers];
  for (const t of items) {
    rows.push([
      t.date ? formatDateForDisplay(t.date) : (t.created_at ? formatDateForDisplay(t.created_at) : ''),
      t.type ?? '',
      t.category ?? '',
      formatCurrency(Number(t.amount ?? 0)),
      t.description ?? '',
      t.related_id ?? '',
    ]);
  }
  return csv(rows);
};

// 8) Analisis Profit — terima data agregat fleksibel (array of objects)
export const sheetProfitAnalysisCSV = (items: any[] = []): string => {
  const headers = ['Periode', 'Pendapatan (Rp)', 'COGS (Rp)', 'OPEX (Rp)', 'Laba Kotor (Rp)', 'Laba Bersih (Rp)'];
  const rows: Row[] = [headers];
  for (const r of items) {
    rows.push([
      r.period ?? r.periode ?? '',
      formatCurrency(Number(r.total_revenue ?? r.totalRevenue ?? 0)),
      formatCurrency(Number(r.total_cogs ?? r.totalCogs ?? 0)),
      formatCurrency(Number(r.total_opex ?? r.totalOpex ?? 0)),
      formatCurrency(Number(r.gross_profit ?? r.grossProfit ?? 0)),
      formatCurrency(Number(r.net_profit ?? r.netProfit ?? 0)),
    ]);
  }
  return csv(rows);
};

// 9) Manajemen Aset (assets)
export const sheetAssetsCSV = (items: any[] = []): string => {
  const headers = [
    'Nama Aset', 'Kategori', 'Kondisi', 'Lokasi', 'Nilai Awal (Rp)', 'Nilai Sekarang (Rp)', 'Depresiasi (Rp)', 'Tanggal Beli', 'Dibuat'
  ];
  const rows: Row[] = [headers];
  for (const a of items) {
    rows.push([
      a.nama ?? '',
      a.kategori ?? '',
      a.kondisi ?? '',
      a.lokasi ?? '',
      formatCurrency(Number(a.nilai_awal ?? 0)),
      formatCurrency(Number(a.nilai_sekarang ?? 0)),
      formatCurrency(Number(a.depresiasi ?? 0)),
      a.tanggal_beli ? formatDateForDisplay(a.tanggal_beli) : '',
      a.created_at ? formatDateForDisplay(a.created_at) : '',
    ]);
  }
  return csv(rows);
};

// 10) Promos
export const sheetPromosCSV = (items: any[] = []): string => {
  const headers = ['Nama Promo', 'Tipe', 'Status', 'Mulai', 'Selesai', 'Deskripsi'];
  const rows: Row[] = [headers];
  for (const p of items) {
    rows.push([
      p.nama_promo ?? '',
      p.tipe_promo ?? '',
      p.status ?? '',
      p.tanggal_mulai ? formatDateForDisplay(p.tanggal_mulai) : '',
      p.tanggal_selesai ? formatDateForDisplay(p.tanggal_selesai) : '',
      p.deskripsi ?? '',
    ]);
  }
  return csv(rows);
};

// 11) Bisnis/App Settings — minimal contoh
export const sheetBusinessCSV = (items: any[] = []): string => {
  const headers = ['Nama Bisnis', 'Alamat', 'Email', 'Telepon', 'Updated'];
  const rows: Row[] = [headers];
  for (const b of items) {
    rows.push([
      b.business_name ?? b.nama_bisnis ?? '',
      b.address ?? '',
      b.email ?? '',
      b.phone ?? '',
      b.updated_at ? formatDateForDisplay(b.updated_at) : '',
    ]);
  }
  return csv(rows);
};

export const ExportUtils = {
  sheetWarehouseCSV,
  sheetSuppliersCSV,
  sheetPurchasesCSV,
  sheetOrdersCSV,
  sheetRecipesCSV,
  sheetOperationalCostsCSV,
  sheetFinancialTransactionsCSV,
  sheetProfitAnalysisCSV,
  sheetAssetsCSV,
  sheetPromosCSV,
  sheetBusinessCSV,
};

export default ExportUtils;
