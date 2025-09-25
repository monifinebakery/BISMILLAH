// src/hooks/useSharedFormatters.ts
// Hook untuk mendapatkan formatter yang mengikuti pengaturan mata uang dari CurrencyContext
import { useSafeCurrency } from './useSafeCurrency';
import { formatCompactCurrency } from '@/lib/shared/formatters';

/**
 * Hook yang mengembalikan fungsi format yang sesuai dengan pengaturan mata uang pengguna
 */
export const useSharedFormatters = () => {
  const { formatCurrency, currentCurrency } = useSafeCurrency();
  
  // Fungsi formatCompactCurrency yang mengikuti pengaturan mata uang pengguna
  const formatCompactCurrencyWithContext = (value: number | null | undefined, options: any = {}) => {
    return formatCompactCurrency(value, {
      ...options,
      currencyCode: currentCurrency.code
    });
  };
  
  return {
    formatCurrency,
    formatCompactCurrency: formatCompactCurrencyWithContext,
    currentCurrency
  };
};