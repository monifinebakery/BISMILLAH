// src/hooks/useSafeCurrency.ts
// Safe wrapper for useCurrency that provides fallback when context is not available

import { CURRENCIES } from '@/contexts/CurrencyContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { logger } from '@/utils/logger';

/**
 * Safe version of useCurrency that provides fallback values
 * when the CurrencyContext is not available (e.g., during lazy loading)
 */
export const useSafeCurrency = () => {
  try {
    // Try to use the normal currency context
    return useCurrency();
  } catch (error) {
    // If context is not available, provide fallback
    logger.warn('useSafeCurrency: CurrencyContext not available, using fallback:', error);
    
    const fallbackCurrency = CURRENCIES[0]; // Default to IDR
    
    return {
      currentCurrency: fallbackCurrency,
      currencies: CURRENCIES,
      setCurrency: async () => {
        logger.warn('useSafeCurrency: setCurrency called on fallback, ignoring');
      },
      formatCurrency: (amount: number, options: { showSymbol?: boolean } = {}) => {
        const validAmount = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? amount : 0;
        // Simple fallback formatting for IDR
        return `Rp ${validAmount.toLocaleString('id-ID')}`;
      },
      formatCurrencyCompact: (amount: number) => {
        const validAmount = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? amount : 0;
        if (validAmount >= 1000000) {
          return `Rp ${(validAmount / 1000000).toFixed(1)}M`;
        } else if (validAmount >= 1000) {
          return `Rp ${(validAmount / 1000).toFixed(1)}K`;
        }
        return `Rp ${validAmount.toLocaleString('id-ID')}`;
      },
      getCurrencyByCode: (code: string) => {
        return CURRENCIES.find(c => c.code === code);
      },
    };
  }
};
