// src/components/profitAnalysis/tabs/RincianTab/constants/messages.ts

export const TAB_LABELS = {
  OVERVIEW: 'Ringkasan Biaya',
  COGS_DETAIL: 'Detail HPP',
  OPEX_DETAIL: 'Detail OPEX',
  ANALYSIS: 'Analisis & Target'
} as const;

export const SECTION_TITLES = {
  // Overview
  COST_OVERVIEW: 'Ringkasan Biaya',
  HPP_SUMMARY: 'Ringkasan HPP',
  OPEX_SUMMARY: 'Ringkasan OPEX',
  QUICK_RATIO: 'Quick Ratio Analysis',
  
  // COGS Detail
  MATERIAL_COSTS: 'Biaya Material',
  LABOR_COSTS: 'Biaya Tenaga Kerja',
  MATERIAL_USAGE: 'Analisis Penggunaan Material',
  
  // OPEX Detail
  ADMIN_EXPENSES: 'Biaya Administrasi',
  SELLING_EXPENSES: 'Biaya Penjualan',
  GENERAL_EXPENSES: 'Biaya Umum',
  
  // Analysis
  EFFICIENCY_METRICS: 'Metrik Efisiensi',
  TARGET_VS_ACTUAL: 'Target vs Aktual',
  RECOMMENDATIONS: 'Rekomendasi',
  ACTION_ITEMS: 'Action Items'
} as const;

export const STATUS_MESSAGES = {
  EXCELLENT: 'Sangat Baik',
  GOOD: 'Baik',
  FAIR: 'Cukup',
  POOR: 'Rendah',
  CRITICAL: 'Kritis'
} as const;

export const RECOMMENDATIONS = {
  MATERIAL_HIGH: 'Biaya material tinggi - review supplier dan optimalisasi penggunaan',
  LABOR_HIGH: 'Biaya tenaga kerja tinggi - evaluasi produktivitas dan otomasi',
  OPEX_HIGH: 'Biaya operasional tinggi - streamline proses dan efisiensi',
  COGS_HIGH: 'HPP tinggi - comprehensive cost reduction program',
  DATA_ESTIMATED: 'Gunakan actual material usage untuk akurasi yang lebih baik',
  MARGIN_LOW: 'Margin rendah - fokus pada peningkatan efisiensi dan pricing'
} as const;

export const EMPTY_STATE = {
  NO_DATA: 'Tidak ada data tersedia',
  NO_DETAIL: 'Detail tidak tersedia',
  NO_BREAKDOWN: 'Breakdown tidak tersedia',
  LOADING: 'Memuat data...',
  ERROR: 'Terjadi kesalahan'
} as const;

export const BUTTON_LABELS = {
  REFRESH: 'Perbarui',
  EXPORT: 'Ekspor',
  VIEW_DETAIL: 'Lihat Detail',
  ANALYZE: 'Analisis',
  OPTIMIZE: 'Optimalisasi'
} as const;