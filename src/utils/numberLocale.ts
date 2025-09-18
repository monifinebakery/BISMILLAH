// src/utils/numberLocale.ts
// Central helpers for Indonesian number formatting and parsing

export const formatIDNumber = (
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string => {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return new Intl.NumberFormat('id-ID', options).format(value);
};

export const formatIDDecimal = (
  value: number | null | undefined,
  decimals: number = 2
): string => {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Parse Indonesian-formatted number string to JS number
// Examples: "1.234,56" -> 1234.56, "2.000" -> 2000
export const parseIDNumber = (input: string | number | null | undefined): number => {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  const str = String(input).trim();
  if (!str) return 0;
  // Remove thousands separator and switch decimal comma to dot
  const normalized = str.replace(/\./g, '').replace(/,/g, '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// Currency helper with optional fraction digits (by default Rupiah has 0)
export const formatIDRCurrency = (
  value: number | null | undefined,
  fractionDigits: number = 0
): string => {
  if (typeof value !== 'number' || isNaN(value)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

