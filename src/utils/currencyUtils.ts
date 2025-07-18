// src/utils/currencyUtils.ts

/**
 * Formats a number as Indonesian Rupiah currency.
 * @param value The number to format.
 * @returns A string formatted as "Rp X.XXX.XXX".
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};