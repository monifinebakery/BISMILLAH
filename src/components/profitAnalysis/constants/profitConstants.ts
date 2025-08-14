// 2. CONSTANTS - src/components/profitAnalysis/constants/profitConstants.ts
// ==============================================

export const PROFIT_CONSTANTS = {
  PERIOD_TYPES: {
    MONTHLY: 'monthly' as const,
    QUARTERLY: 'quarterly' as const,
    YEARLY: 'yearly' as const,
  },
  
  CALCULATION_METHODS: {
    REAL_TIME: 'real_time' as const, // Calculate on-demand
    STORED: 'stored' as const,       // Use pre-calculated data
  },
  
  MARGIN_THRESHOLDS: {
    EXCELLENT: {
      gross: 0.50, // 50%
      net: 0.20,   // 20%
    },
    GOOD: {
      gross: 0.40, // 40%
      net: 0.15,   // 15%
    },
    FAIR: {
      gross: 0.30, // 30%
      net: 0.10,   // 10%
    },
    POOR: {
      gross: 0.20, // 20%
      net: 0.05,   // 5%
    }
  },
  
  DEFAULT_PERIODS: {
    CURRENT_MONTH: new Date().toISOString().slice(0, 7), // "2024-01"
    MONTHS_TO_ANALYZE: 12, // Last 12 months
  }
} as const;

export const REVENUE_CATEGORIES = [
  'Penjualan Produk',
  'Jasa Konsultasi',
  'Penjualan Online',
  'Komisi',
  'Lainnya'
] as const;

export const CHART_CONFIG = {
  colors: {
    revenue: '#16a34a',     // Green
    cogs: '#f59e0b',        // Amber  
    opex: '#dc2626',        // Red
    gross_profit: '#2563eb', // Blue
    net_profit: '#8b5cf6',   // Purple
    positive: '#16a34a',
    negative: '#dc2626',
    neutral: '#6b7280'
  },
  margin_colors: {
    excellent: '#16a34a',
    good: '#65a30d', 
    fair: '#f59e0b',
    poor: '#dc2626'
  }
} as const;