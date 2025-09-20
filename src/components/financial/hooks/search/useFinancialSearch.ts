// src/components/financial/hooks/search/useFinancialSearch.ts
import { useState, useMemo, useCallback } from 'react';
import { searchTransactions } from '../../utils/financialCalculations';
import { FinancialTransaction, DateRange } from '../../types/financial';

interface SearchFilters {
  type?: 'income' | 'expense';
  category?: string;
  dateRange?: DateRange;
  amountRange?: { min?: number; max?: number };
}

interface UseFinancialSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: SearchFilters;
  updateFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  searchResults: FinancialTransaction[];
  hasActiveFilters: boolean;
}

/**
 * Financial Search Hook
 * Handles search functionality and filtering for financial transactions
 */
export const useFinancialSearch = (transactions: FinancialTransaction[]): UseFinancialSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});

  const searchResults = useMemo(() => {
    return searchTransactions(transactions, searchQuery, filters);
  }, [transactions, searchQuery, filters]);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    clearFilters,
    searchResults,
    hasActiveFilters: Object.keys(filters).length > 0 || searchQuery.length > 0
  };
};