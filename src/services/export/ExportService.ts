// src/services/export/ExportService.ts
// Global export service: single entry point to export multiple modules consistently

import type { Recipe } from '@/components/recipe/types';
import type { Order } from '@/components/orders/types';
import { exportRecipesToCSV } from '@/components/recipe/services/recipeUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { formatCurrency } from '@/lib/shared/formatters';
import { getStatusText } from '@/components/orders/constants';
import * as XLSX from 'xlsx';
import {
  ExportUtils,
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
  sheetHPPBreakdownCSV,
} from './ExportUtils';

export interface SupplierRef {
  id: string;
  nama: string;
}

export interface ExportContext {
  suppliers?: SupplierRef[];
}

export interface GlobalExportInput {
  recipes?: Recipe[];
  orders?: Order[];
}

export interface GeneratedFile {
  filename: string;
  mime: string;
  content: string; // CSV string
}

const createCsv = (rows: (string | number)[][]): string => {
  return rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
};

// Orders exporter (per item rows) to match business-friendly format
const exportOrdersItemsToCSV = (orders: Order[]): string => {
  const headers = [
    'Nomor Pesanan',
    'Tanggal',
    'Nama Pelanggan',
    'Telepon Pelanggan',
    'Alamat Pengiriman',
    'Nama Barang',
    'Jumlah',
    'Harga Satuan',
    'Total Harga',
    'Total Pesanan',
    'Status',
    'Catatan',
  ];

  const rows: (string | number)[][] = [headers];

  for (const o of orders || []) {
    if (!o?.items?.length) {
      rows.push([
        o.order_number || (o as any).nomor_pesanan || '',
        formatDateForDisplay(o.tanggal),
        o.customer_name,
        o.customer_phone,
        o.alamat_pengiriman || '',
        '', // no item
        '',
        '',
        '',
        formatCurrency(o.total_amount ?? (o as any).total_pesanan ?? 0),
        getStatusText(o.status as any),
        o.catatan || '',
      ]);
      continue;
    }

    for (const it of o.items) {
      rows.push([
        o.order_number || (o as any).nomor_pesanan || '',
        formatDateForDisplay(o.tanggal),
        o.customer_name,
        o.customer_phone,
        o.alamat_pengiriman || '',
        it.name,
        String(it.quantity ?? 0),
        formatCurrency(it.price ?? 0),
        formatCurrency(it.total ?? ((it.quantity || 0) * (it.price || 0))),
        formatCurrency(o.total_amount ?? (o as any).total_pesanan ?? 0),
        getStatusText(o.status as any),
        o.catatan || '',
      ]);
    }
  }

  return createCsv(rows);
};

// Global orchestrator
export const ExportService = {
  // Generate CSV files for requested datasets (recipes/orders). Returns array of virtual files.
  generateCSVFiles(input: GlobalExportInput, ctx: ExportContext = {}): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    if (input.recipes && input.recipes.length) {
      const csv = exportRecipesToCSV(input.recipes as any, ctx.suppliers);
      files.push({ filename: 'recipes.csv', mime: 'text/csv;charset=utf-8;', content: csv });
    }

    if (input.orders && input.orders.length) {
      const csv = exportOrdersItemsToCSV(input.orders);
      files.push({ filename: 'orders.csv', mime: 'text/csv;charset=utf-8;', content: csv });
    }

    return files;
  },

  // Convenience: trigger browser downloads (CSV). Caller can also use returned strings.
  downloadCSVFiles(files: GeneratedFile[]) {
    for (const f of files) {
      const blob = new Blob([f.content], { type: f.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = f.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  },

  // =============================
  // XLSX MULTI-SHEET WORKBOOK
  // =============================
  generateXLSXWorkbook(
    input: {
      // Master datasets per sheet
      warehouse?: any[];
      suppliers?: any[];
      purchases?: any[];
      orders?: any[];
      recipes?: any[];
      operational_costs?: any[];
      financial_transactions?: any[];
      profit_analysis?: any[];
      assets?: any[];
      promos?: any[];
      business?: any[];
      // Optional aliases
      gudang?: any[];
      biaya_operasional?: any[];
      laporan_keuangan?: any[];
      analisis_profit?: any[];
      manajemen_aset?: any[];
    },
    filename = 'export.xlsx'
  ) {
    const wb = XLSX.utils.book_new();

    // Helper: build sheet from CSV string
    const appendCsvSheet = (csv: string, name: string) => {
      // Parse CSV into a workbook then extract first sheet
      const tmp = XLSX.read(csv, { type: 'string' });
      const firstName = tmp.SheetNames[0];
      const ws = tmp.Sheets[firstName];
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    // Build each sheet (empty dataset => still create with headers)
    appendCsvSheet(sheetWarehouseCSV(input.warehouse || input.gudang || []), 'Gudang Bahan Baku');
    appendCsvSheet(sheetSuppliersCSV(input.suppliers || []), 'Supplier');
    appendCsvSheet(sheetPurchasesCSV(input.purchases || []), 'Pembelian');
    appendCsvSheet(sheetOrdersCSV(input.orders || []), 'Pesanan');
    appendCsvSheet(sheetRecipesCSV(input.recipes || []), 'Manajemen Resep');
    // Optional helper sheets (placeholders use current datasets)
    appendCsvSheet(sheetOperationalCostsCSV(input.operational_costs || input.biaya_operasional || []), 'Biaya Operasional');
    appendCsvSheet(sheetBusinessCSV(input.business || []), 'Bisnis');
    appendCsvSheet(sheetFinancialTransactionsCSV(input.financial_transactions || input.laporan_keuangan || []), 'Laporan Keuangan');
    appendCsvSheet(sheetProfitAnalysisCSV(input.profit_analysis || input.analisis_profit || []), 'Analisis Profit');
    appendCsvSheet(sheetAssetsCSV(input.assets || input.manajemen_aset || []), 'Manajemen Aset');
    // Tabs requested but no dedicated dataset yet -> create light placeholders
    appendCsvSheet(sheetPromosCSV(input.promos || []), 'Kalkulator Promo');
    // Hitung HPP tab: detailed breakdown per recipe (ingredients + cost steps)
    appendCsvSheet(sheetHPPBreakdownCSV(input.recipes || [], input.suppliers || []), 'Hitung HPP');

    // Download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return wb; // return workbook in case caller wants to do more
  },
};

export default ExportService;
