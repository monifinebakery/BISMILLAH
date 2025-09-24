// src/hooks/useCurrencyFormatter.ts

import { useSafeCurrency } from '@/hooks/useSafeCurrency';

/**
 * Hook for formatting currency using the current currency context
 * This replaces the old formatCurrency function for React components
 * Now uses useSafeCurrency for better compatibility with lazy-loaded components
 */
export const useCurrencyFormatter = () => {
  const { formatCurrency, formatCurrencyCompact, currentCurrency } = useSafeCurrency();

  return {
    formatCurrency,
    formatCurrencyCompact,
    currentCurrency,
  };
};
