// src/components/financial/profit-analysis/constants/index.ts
// ✅ CONSTANTS - Konstanta untuk profit analysis

export const PROFIT_COLORS = {
  excellent: 'green',
  good: 'blue', 
  acceptable: 'orange',
  poor: 'red',
  critical: 'red'
} as const;

export const MARGIN_THRESHOLDS = {
  gross: {
    excellent: 40,
    good: 25,
    acceptable: 15,
    poor: 5
  },
  net: {
    excellent: 15,
    good: 10,
    acceptable: 5,
    poor: 2
  }
} as const;

export const COST_RATIO_TARGETS = {
  cogs: 70, // HPP should be <70% of revenue
  opex: 20, // OPEX should be <20% of revenue
  material: 40, // Material should be <40% of revenue
  labor: 20 // Labor should be <20% of revenue
} as const;

export const EXPORT_CONFIG = {
  formats: ['excel', 'pdf', 'csv'] as const,
  mimeTypes: {
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
    csv: 'text/csv'
  },
  extensions: {
    excel: 'xlsx',
    pdf: 'pdf', 
    csv: 'csv'
  }
} as const;

export const TAB_CONFIG = [
  { id: 'ringkasan', label: 'Ringkasan', icon: '📊' },
  { id: 'rincian', label: 'Rincian', icon: '📋' },
  { id: 'insights', label: 'Insights', icon: '💡' },
  { id: 'perbandingan', label: 'Perbandingan', icon: '📈' }
] as const;