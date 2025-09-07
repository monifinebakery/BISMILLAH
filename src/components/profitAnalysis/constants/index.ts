// src › components › profitAnalysis › constants › index.ts
// ==============================================
// Index file untuk semua konstanta analisis profit dalam Bahasa Indonesia

// Direct re-exports (paling aman dan tidak menyebabkan error)
export {
  PROFIT_CONSTANTS,
  REVENUE_CATEGORIES,
  OPEX_CATEGORIES,
  CHART_CONFIG,
  CURRENCY_CONFIG,
  PERIOD_OPTIONS,
  VALIDATION_RULES,
  getMonthName
} from './profitConstants';

// ✅ NEW: Export centralized query keys
export {
  PROFIT_QUERY_KEYS,
  PROFIT_QUERY_MATCHERS,
  queryKeyUtils,
  type ProfitQueryKey,
  type FnbQueryKey
} from './queryKeys';

// Export types berdasarkan konstanta
export type PeriodType = 'monthly' | 'quarterly' | 'yearly';
export type CalculationMethod = 'real_time' | 'stored';
export type RevenueCategoryType = 'Penjualan Produk' | 'Jasa Konsultasi' | 'Penjualan Online' | 'Komisi Penjualan' | 'Pendapatan Pasif' | 'Lainnya';
export type OpexCategoryType = 'Gaji & Tunjangan' | 'Sewa Kantor' | 'Utilitas' | 'Pemasaran & Iklan' | 'Transportasi' | 'Komunikasi' | 'Administrasi' | 'Lainnya';
export type MarginRating = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type PerformanceStatus = 'IMPROVING' | 'DECLINING' | 'STABLE';

// Helper types untuk chart colors
export type ProfitColorKey = 'revenue' | 'cogs' | 'opex' | 'gross_profit' | 'net_profit' | 'positive' | 'negative' | 'neutral';
export type MarginColorKey = 'excellent' | 'good' | 'fair' | 'poor';

// Interface untuk periode option
export interface PeriodOption {
  value: string;
  label: string;
}

// No default export to avoid circular dependency issues