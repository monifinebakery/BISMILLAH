// src/components/profitAnalysis/tabs/rincianTab/constants/messages.ts

export const TAB_LABELS = {
  OVERVIEW: 'Overview',
  COGS: 'HPP Detail', 
  OPEX: 'OPEX Detail',
  ANALYSIS: 'Analisis'
} as const;

export const SECTION_TITLES = {
  DATA_QUALITY: 'Rincian Perhitungan Profit Margin',
  COST_ANALYSIS: 'Analisis Rincian Biaya',
  HPP_SUMMARY: 'HPP (Harga Pokok Penjualan)',
  OPEX_SUMMARY: 'OPEX (Biaya Operasional)',
  QUICK_RATIO: 'Quick Ratio Analysis',
  MATERIAL_DETAIL: 'Rincian Biaya Material',
  LABOR_DETAIL: 'Rincian Biaya Tenaga Kerja',
  MATERIAL_ANALYTICS: 'Material Usage Analytics',
  ADMIN_EXPENSES: 'Biaya Administrasi',
  SELLING_EXPENSES: 'Biaya Penjualan', 
  GENERAL_EXPENSES: 'Biaya Umum',
  EFFICIENCY_METRICS: 'Metrik Efisiensi',
  TARGET_HPP: 'Target HPP',
  TARGET_OPEX: 'Target OPEX',
  TARGET_MARGIN: 'Target Margin',
  RECOMMENDATIONS: 'Rekomendasi Optimisasi',
  ACTION_ITEMS: 'Ringkasan & Action Items'
} as const;

export const STATUS_MESSAGES = {
  ON_TARGET: {
    hpp: '✅ Dalam target yang sehat',
    opex: '✅ Efisiensi operasional baik', 
    margin: '✅ Margin sehat dan menguntungkan'
  },
  ABOVE_TARGET: {
    hpp: '⚠️ Melebihi target, perlu optimisasi',
    opex: '⚠️ OPEX tinggi, review efisiensi',
    margin: '⚠️ Margin perlu ditingkatkan'
  },
  BELOW_TARGET: {
    margin: '⚠️ Margin di bawah target minimum'
  }
} as const;

export const RECOMMENDATIONS = {
  MATERIAL_HIGH: {
    title: 'Optimisasi Material',
    description: 'Review supplier dan efisiensi penggunaan material.'
  },
  LABOR_HIGH: {
    title: 'Efisiensi Tenaga Kerja',
    description: 'Evaluasi produktivitas dan otomasi proses.'
  },
  OPEX_HIGH: {
    title: 'Kontrol OPEX', 
    description: 'Review biaya operasional yang tidak esensial.'
  },
  DATA_QUALITY: {
    title: 'Upgrade Data Quality',
    description: 'Implement material usage tracking untuk akurasi HPP yang lebih tinggi dan decision making yang lebih baik.'
  }
} as const;

export const EMPTY_STATE = {
  title: 'Data tidak tersedia',
  description: 'Silakan periksa kembali data input Anda'
} as const;

export const BUTTON_LABELS = {
  SHOW_DETAIL: 'Lihat Detail',
  HIDE_DETAIL: 'Sembunyikan Detail'
} as const;