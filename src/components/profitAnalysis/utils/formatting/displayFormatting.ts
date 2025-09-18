// src/components/profitAnalysis/utils/formatting/displayFormatting.ts
// Display formatting utilities

/**
 * Format currency for Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format percentage with specified decimal places
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers with Indonesian abbreviations
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)} miliar`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} jt`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} rb`;
  }
  return num.toString();
};
