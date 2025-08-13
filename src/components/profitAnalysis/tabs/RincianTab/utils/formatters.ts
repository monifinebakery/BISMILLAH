// src/components/profitAnalysis/tabs/rincianTab/utils/formatters.ts

/**
 * Enhanced currency formatter for Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format percentage with configurable decimal places
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format ratio/multiplier (e.g., 2.5x)
 */
export const formatRatio = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}x`;
};

/**
 * Format compact currency for large numbers
 */
export const formatCompactCurrency = (amount: number): string => {
  if (amount >= 1e9) {
    return `Rp ${(amount / 1e9).toFixed(1)}B`;
  }
  if (amount >= 1e6) {
    return `Rp ${(amount / 1e6).toFixed(1)}M`;
  }
  if (amount >= 1e3) {
    return `Rp ${(amount / 1e3).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

/**
 * Format data source label
 */
export const formatDataSource = (source: string): string => {
  const sourceMap: Record<string, string> = {
    'actual': 'Aktual',
    'mixed': 'Campuran', 
    'estimated': 'Estimasi'
  };
  return sourceMap[source] || source;
};

/**
 * Format allocation method label
 */
export const formatAllocationMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    'direct': 'Langsung',
    'activity_based': 'Berbasis Aktivitas',
    'proportional': 'Proporsional',
    'fixed_rate': 'Tarif Tetap'
  };
  return methodMap[method] || method;
};

/**
 * Format cost type label
 */
export const formatCostType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'tetap': 'Biaya Tetap',
    'variabel': 'Biaya Variabel',
    'fixed': 'Biaya Tetap',
    'variable': 'Biaya Variabel'
  };
  return typeMap[type] || type;
};

/**
 * Format usage type label
 */
export const formatUsageType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'production': 'Produksi',
    'maintenance': 'Pemeliharaan',
    'quality_control': 'Quality Control',
    'packaging': 'Packaging',
    'waste': 'Waste/Sisa'
  };
  return typeMap[type] || type;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format material ID for display
 */
export const formatMaterialId = (id: string, maxLength: number = 12): string => {
  return truncateText(id, maxLength);
};