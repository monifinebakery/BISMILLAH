// src/contexts/CurrencyContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { safeStorageGetJSON, safeStorageSetJSON } from '@/utils/auth/safeStorage';
import { logger } from '@/utils/logger';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  flag?: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', locale: 'id-ID', flag: '🇮🇩' },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN', flag: '🇨🇳' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩', locale: 'ko-KR', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', locale: 'ms-MY', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', locale: 'th-TH', flag: '🇹🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', locale: 'vi-VN', flag: '🇻🇳' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', locale: 'en-PH', flag: '🇵🇭' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', locale: 'zh-HK', flag: '🇭🇰' },
  { code: 'TWD', name: 'Taiwan Dollar (NTD)', symbol: 'NT$', locale: 'zh-TW', flag: '🇹🇼' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH', flag: '🇨🇭' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', locale: 'sv-SE', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', locale: 'nb-NO', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', locale: 'da-DK', flag: '🇩🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', locale: 'en-NZ', flag: '🇳🇿' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'en-ZA', flag: '🇿🇦' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', locale: 'es-MX', flag: '🇲🇽' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'hi-IN', flag: '🇮🇳' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', locale: 'ru-RU', flag: '🇷🇺' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', locale: 'tr-TR', flag: '🇹🇷' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', locale: 'pl-PL', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', locale: 'cs-CZ', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', locale: 'hu-HU', flag: '🇭🇺' },
];

const STORAGE_KEY = 'selectedCurrency';

interface CurrencyContextType {
  currentCurrency: Currency;
  currencies: Currency[];
  setCurrency: (currency: Currency) => Promise<void>;
  formatCurrency: (amount: number, options?: { showSymbol?: boolean }) => string;
  formatCurrencyCompact: (amount: number) => string;
  getCurrencyByCode: (code: string) => Currency | undefined;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(CURRENCIES[0]); // Default IDR

  // Load currency from safeStorage on mount
  useEffect(() => {
    const saved = safeStorageGetJSON<{ code: string }>(STORAGE_KEY);
    if (saved?.code) {
      const found = CURRENCIES.find(c => c.code === saved.code);
      if (found) {
        setCurrentCurrency(found);
      }
    }
  }, []);

  // Save currency to safeStorage when changed
  const handleSetCurrency = async (currency: Currency) => {
    setCurrentCurrency(currency);
    const success = await safeStorageSetJSON(STORAGE_KEY, { code: currency.code });
    if (!success) {
      logger.warn('CurrencyContext: Failed to save currency preference');
    }
  };

  // Format currency using current currency settings
  const formatCurrency = (amount: number, options: { showSymbol?: boolean } = {}): string => {
    const { showSymbol = true } = options;
    const validAmount = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? amount : 0;

    try {
      const formatter = new Intl.NumberFormat(currentCurrency.locale, {
        style: 'currency',
        currency: currentCurrency.code,
        minimumFractionDigits: currentCurrency.code === 'IDR' ? 0 : 2,
        maximumFractionDigits: currentCurrency.code === 'IDR' ? 0 : 2,
      });

      let formatted = formatter.format(validAmount);

      // For some currencies, remove the currency code if we only want symbol
      if (!showSymbol && currentCurrency.symbol) {
        // Remove currency code and keep only symbol
        formatted = formatted.replace(/[A-Z]{3}/g, '').trim();
        if (!formatted.startsWith(currentCurrency.symbol)) {
          formatted = currentCurrency.symbol + formatted.replace(/[^\d.,-]/g, '');
        }
      }

      return formatted;
    } catch (error) {
      console.warn('Currency formatting error:', error);
      // Fallback formatting
      return `${currentCurrency.symbol}${validAmount.toLocaleString()}`;
    }
  };

  // Compact currency formatting for small spaces
  const formatCurrencyCompact = (amount: number): string => {
    const validAmount = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? amount : 0;

    try {
      if (validAmount >= 1000000) {
        return `${currentCurrency.symbol}${(validAmount / 1000000).toFixed(1)}M`;
      } else if (validAmount >= 1000) {
        return `${currentCurrency.symbol}${(validAmount / 1000).toFixed(1)}K`;
      }
      return formatCurrency(validAmount);
    } catch (error) {
      return `${currentCurrency.symbol}${validAmount}`;
    }
  };

  // Get currency by code
  const getCurrencyByCode = (code: string): Currency | undefined => {
    return CURRENCIES.find(c => c.code === code);
  };

  const value: CurrencyContextType = {
    currentCurrency,
    currencies: CURRENCIES,
    setCurrency: handleSetCurrency,
    formatCurrency,
    formatCurrencyCompact,
    getCurrencyByCode,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

// Export default currency for backward compatibility
export const DEFAULT_CURRENCY = CURRENCIES[0];
