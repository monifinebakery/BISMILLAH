// src/lib/shared/currencyFormatter.ts
// Shared utility for currency formatting that can work with or without React context
import { CURRENCIES } from '@/contexts/CurrencyContext';

// Default to IDR if no currency is specified
const DEFAULT_CURRENCY = CURRENCIES[0]; // IDR

/**
 * Format currency using provided or default currency settings
 * Used for non-React contexts where we can't use useSafeCurrency hook
 */
export const formatCurrencyWithCode = (
  value: number | null | undefined,
  currencyCode: string = DEFAULT_CURRENCY.code,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    const currency = CURRENCIES.find(c => c.code === currencyCode) || DEFAULT_CURRENCY;
    return `${currency.symbol} 0`;
  }

  const currency = CURRENCIES.find(c => c.code === currencyCode) || DEFAULT_CURRENCY;
  const locale = options.locale || currency.locale;
  const minDigits = options.minimumFractionDigits ?? (currencyCode === 'IDR' ? 0 : 2);
  const maxDigits = options.maximumFractionDigits ?? (currencyCode === 'IDR' ? 0 : 2);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    }).format(value);
  } catch (error) {
    console.warn('Currency formatting error, falling back to default:', error);
    // Fallback formatting
    return `${currency.symbol}${value.toLocaleString()}`;
  }
};

/**
 * Format large numbers with Indonesian abbreviations (rb, jt, miliar)
 * Uses currency settings based on provided currency code
 */
export const formatCompactCurrencyWithCode = (
  value: number | null | undefined,
  currencyCode: string = DEFAULT_CURRENCY.code,
  options: {
    digits?: number;
    withCurrency?: boolean;
    threshold?: number;
  } = {}
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    const currency = CURRENCIES.find(c => c.code === currencyCode) || DEFAULT_CURRENCY;
    return options.withCurrency !== false ? `${currency.symbol} 0` : '0';
  }

  const {
    digits = 1,
    withCurrency = true,
    threshold = 1000
  } = options;

  const currency = CURRENCIES.find(c => c.code === currencyCode) || DEFAULT_CURRENCY;

  const abbreviations = [
    { value: 1E12, symbol: 'T' },  // triliun
    { value: 1E9, symbol: 'B' },   // miliar
    { value: 1E6, symbol: 'Jt' },  // juta
    { value: 1E3, symbol: 'Rb' },  // ribu
    { value: 1, symbol: '' }
  ];

  // Jika di bawah threshold, gunakan format penuh
  if (Math.abs(value) < threshold) {
    return formatCurrencyWithCode(value, currencyCode, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // Cari abbreviation yang tepat
  for (const abbr of abbreviations) {
    if (Math.abs(value) >= abbr.value) {
      const abbreviated = (value / abbr.value).toFixed(digits);
      const cleanValue = abbreviated.replace(/\.0+$/, '');
      
      if (withCurrency) {
        return `${currency.symbol} ${cleanValue}${abbr.symbol}`;
      } else {
        return `${cleanValue}${abbr.symbol}`;
      }
    }
  }

  return withCurrency ? formatCurrencyWithCode(value, currencyCode) : Math.abs(value).toString();
};