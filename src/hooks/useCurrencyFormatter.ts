// src/hooks/useCurrencyFormatter.ts

import { useCurrency } from '@/contexts/CurrencyContext';

/**
 * Hook for formatting currency using the current currency context
 * This replaces the old formatCurrency function for React components
 */
export const useCurrencyFormatter = () => {
  const { formatCurrency, formatCurrencyCompact, currentCurrency } = useCurrency();

  return {
    formatCurrency,
    formatCurrencyCompact,
    currentCurrency,
  };
};
