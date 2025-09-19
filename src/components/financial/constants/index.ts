// src/components/financial/constants/index.ts
// Constants and configuration for financial modules

import { FinancialCategories } from '../types/financial';

// ===========================================
// CHART CONFIGURATION
// ===========================================

export const CHART_CONFIG = {
  colors: {
    primary: ['#16a34a', '#2563eb', '#f59e0b', '#8b5cf6', '#dc2626', '#06b6d4'],
    income: '#16a34a',
    expense: '#dc2626',
    balance: '#2563eb',
    positive: '#16a34a',
    negative: '#dc2626',
    neutral: '#6b7280'
  },
  dimensions: {
    defaultHeight: 320,
    mobileHeight: 250,
    pieRadius: 100,
    mobileRadius: 80
  },
  animation: {
    duration: 300,
    easing: 'ease-in-out'
  }
} as const;

// ===========================================
// DEFAULT CATEGORIES
// ===========================================

export const DEFAULT_CATEGORIES: FinancialCategories = {
  income: [
    'Penjualan Produk',
    'Jasa Konsultasi', 
    'Penjualan Online',
    'Komisi',
    'Investasi',
    'Bonus',
    'Hadiah',
    'Lainnya'
  ],
  expense: [
    'Pembelian Bahan Baku',
    'Gaji Karyawan',
    'Sewa Tempat',
    'Listrik & Air',
    'Internet & Telepon',
    'Marketing & Promosi',
    'Transportasi',
    'Peralatan',
    'Pajak',
    'Asuransi',
    'Maintenance',
    'Lainnya'
  ]
} as const;

// ===========================================
// PAGINATION SETTINGS
// ===========================================

export const PAGINATION_CONFIG = {
  defaultItemsPerPage: 10,
  itemsPerPageOptions: [5, 10, 20, 50],
  maxVisiblePages: 5
} as const;

// ===========================================
// FORM VALIDATION
// ===========================================

export const VALIDATION_RULES = {
  amount: {
    min: 0.01,
    max: 999999999,
    required: true
  },
  description: {
    minLength: 1,
    maxLength: 200,
    required: true
  },
  category: {
    required: true
  },
  date: {
    required: true
  }
} as const;

export const ERROR_MESSAGES = {
  amount: {
    required: 'Jumlah transaksi wajib diisi',
    min: 'Jumlah harus lebih dari 0',
    max: 'Jumlah terlalu besar',
    invalid: 'Format jumlah tidak valid'
  },
  description: {
    required: 'Deskripsi wajib diisi',
    minLength: 'Deskripsi terlalu pendek',
    maxLength: 'Deskripsi terlalu panjang'
  },
  category: {
    required: 'Kategori wajib dipilih',
    invalid: 'Kategori tidak valid'
  },
  date: {
    required: 'Tanggal wajib diisi',
    invalid: 'Format tanggal tidak valid',
    future: 'Tanggal tidak boleh di masa depan'
  },
  general: {
    required: 'Field ini wajib diisi',
    invalid: 'Data tidak valid',
    serverError: 'Terjadi kesalahan server',
    networkError: 'Koneksi bermasalah'
  }
} as const;

// ===========================================
// DATE PRESETS
// ===========================================

export const DATE_PRESETS = [
  {
    key: 'today',
    label: 'Hari Ini',
    description: 'Transaksi hari ini'
  },
  {
    key: 'yesterday', 
    label: 'Kemarin',
    description: 'Transaksi kemarin'
  },
  {
    key: 'last7days',
    label: '7 Hari Terakhir',
    description: 'Transaksi 7 hari terakhir'
  },
  {
    key: 'last30days',
    label: '30 Hari Terakhir', 
    description: 'Transaksi 30 hari terakhir'
  },
  {
    key: 'thisMonth',
    label: 'Bulan Ini',
    description: 'Transaksi bulan ini'
  },
  {
    key: 'lastMonth',
    label: 'Bulan Lalu',
    description: 'Transaksi bulan lalu'
  },
  {
    key: 'thisYear',
    label: 'Tahun Ini',
    description: 'Transaksi tahun ini'
  },
  {
    key: 'custom',
    label: 'Custom',
    description: 'Pilih rentang tanggal sendiri'
  }
] as const;

// ===========================================
// TRANSACTION TYPES
// ===========================================

export const TRANSACTION_TYPES = {
  income: {
    value: 'income',
    label: 'Pemasukan',
    description: 'Uang masuk ke bisnis',
    color: CHART_CONFIG.colors.income,
    icon: 'trending-up'
  },
  expense: {
    value: 'expense', 
    label: 'Pengeluaran',
    description: 'Uang keluar dari bisnis',
    color: CHART_CONFIG.colors.expense,
    icon: 'trending-down'
  }
} as const;

// ===========================================
// FORMAT SETTINGS
// ===========================================

export const FORMAT_CONFIG = {
  currency: {
    locale: 'id-ID',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  },
  date: {
    locale: 'id-ID',
    options: {
      day: 'numeric',
      month: 'short', 
      year: 'numeric'
    }
  },
  number: {
    locale: 'id-ID',
    notation: 'compact' as const,
    compactDisplay: 'short' as const
  }
} as const;

// ===========================================
// LOADING & UI STATES
// ===========================================

export const UI_CONFIG = {
  loadingLines: 5,
  loadingDelay: 300,
  toastDuration: 3000,
  modalTransition: 200,
  tableRowHeight: 60,
  mobileBreakpoint: 768
} as const;

// ===========================================
// API ENDPOINTS (if needed)
// ===========================================

export const API_ENDPOINTS = {
  transactions: '/api/financial-transactions',
  categories: '/api/financial-categories',
  summary: '/api/financial-summary',
  export: '/api/financial-export'
} as const;

// ===========================================
// EXPORT GROUPS
// ===========================================

export const ChartConstants = {
  ...CHART_CONFIG
} as const;

export const FormConstants = {
  ...VALIDATION_RULES,
  ...ERROR_MESSAGES,
  defaultCategories: DEFAULT_CATEGORIES
} as const;

export const UIConstants = {
  ...UI_CONFIG,
  ...PAGINATION_CONFIG,
  datePresets: DATE_PRESETS,
  transactionTypes: TRANSACTION_TYPES
} as const;

export const FormatConstants = {
  ...FORMAT_CONFIG
} as const;

// Default export for convenience
export default {
  chart: ChartConstants,
  form: FormConstants,
  ui: UIConstants,
  format: FormatConstants,
  api: API_ENDPOINTS
} as const;