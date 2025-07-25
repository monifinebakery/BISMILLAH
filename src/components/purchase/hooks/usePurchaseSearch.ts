import { useState, useMemo, useCallback } from 'react';
import { Purchase } from '@/types/supplier';
import { validateSearchTerm } from '../services/purchaseValidators';
import { getSupplierName } from '../services/purchaseTransformers';

export interface SearchFilters {
  searchTerm: string;
  statusFilter: string;
  supplierFilter: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  amountRange: {
    min: number | null;
    max: number | null;
  };
}

export interface UsePurchaseSearchOptions {
  purchases: Purchase[];
  suppliers: any[];
  debounceMs?: number;
}

export const usePurchaseSearch = (options: UsePurchaseSearchOptions) => {
  const { purchases, suppliers, debounceMs = 300 } = options;

  // Search filters state
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    statusFilter: '',
    supplierFilter: '',
    dateRange: { start: null, end: null },
    amountRange: { min: null, max: null },
  });

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters.searchTerm, debounceMs]);

  /**
   * Update specific filter
   */
  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Update search term
   */
  const setSearchTerm = useCallback((term: string) => {
    if (validateSearchTerm(term)) {
      updateFilter('searchTerm', term);
    }
  }, [updateFilter]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statusFilter: '',
      supplierFilter: '',
      dateRange: { start: null, end: null },
      amountRange: { min: null, max: null },
    });
    setDebouncedSearchTerm('');
  }, []);

  /**
   * Set quick filters
   */
  const setQuickFilter = useCallback((type: 'today' | 'week' | 'month' | 'pending' | 'completed') => {
    const now = new Date();
    
    switch (type) {
      case 'today':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        updateFilter('dateRange', { start: startOfDay, end: endOfDay });
        break;
        
      case 'week':
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        updateFilter('dateRange', { start: startOfWeek, end: now });
        break;
        
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        updateFilter('dateRange', { start: startOfMonth, end: now });
        break;
        
      case 'pending':
        updateFilter('statusFilter', 'pending');
        break;
        
      case 'completed':
        updateFilter('statusFilter', 'completed');
        break;
    }
  }, [updateFilter]);

  /**
   * Filter purchases based on all filters
   */
  const filteredPurchases = useMemo(() => {
    let filtered = [...purchases];

    // Text search (supplier name)
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(purchase => {
        const supplierName = getSupplierName(purchase.supplier, suppliers);
        return supplierName.toLowerCase().includes(searchLower);
      });
    }

    // Status filter
    if (filters.statusFilter) {
      filtered = filtered.filter(purchase => purchase.status === filters.statusFilter);
    }

    // Supplier filter
    if (filters.supplierFilter) {
      filtered = filtered.filter(purchase => purchase.supplier === filters.supplierFilter);
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(purchase => {
        const purchaseDate = new Date(purchase.tanggal);
        
        if (filters.dateRange.start && purchaseDate < filters.dateRange.start) {
          return false;
        }
        
        if (filters.dateRange.end && purchaseDate > filters.dateRange.end) {
          return false;
        }
        
        return true;
      });
    }

    // Amount range filter
    if (filters.amountRange.min !== null || filters.amountRange.max !== null) {
      filtered = filtered.filter(purchase => {
        if (filters.amountRange.min !== null && purchase.totalNilai < filters.amountRange.min) {
          return false;
        }
        
        if (filters.amountRange.max !== null && purchase.totalNilai > filters.amountRange.max) {
          return false;
        }
        
        return true;
      });
    }

    return filtered;
  }, [purchases, suppliers, debouncedSearchTerm, filters]);

  /**
   * Get search statistics
   */
  const searchStats = useMemo(() => {
    const total = purchases.length;
    const filtered = filteredPurchases.length;
    const hasActiveFilters = 
      debouncedSearchTerm.trim() !== '' ||
      filters.statusFilter !== '' ||
      filters.supplierFilter !== '' ||
      filters.dateRange.start !== null ||
      filters.dateRange.end !== null ||
      filters.amountRange.min !== null ||
      filters.amountRange.max !== null;

    return {
      total,
      filtered,
      hidden: total - filtered,
      hasActiveFilters,
      filterRatio: total > 0 ? (filtered / total) * 100 : 0,
    };