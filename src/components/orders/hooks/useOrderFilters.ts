// src/components/orders/hooks/useOrderFilters.ts - DEPRECATED in favor of useOrderUI
/**
 * @deprecated Use useOrderUI instead - it has more comprehensive filtering, pagination, and selection
 * 
 * This hook is kept for backward compatibility but useOrderUI is recommended.
 * Your useOrderUI hook includes:
 * - All filtering capabilities from this hook
 * - Selection management  
 * - Pagination
 * - Better performance with memoization
 */

import { useState, useMemo, useCallback } from 'react';
import type { Order, OrderStatus } from '../types';
import { searchOrders, filterOrdersByStatus } from '../utils';

export interface OrderFilters {
  searchTerm: string;
  statusFilter: OrderStatus | 'all';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface UseOrderFiltersReturn {
  // Filter state
  filters: OrderFilters;
  
  // Filter actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: OrderStatus | 'all') => void;
  setDateRange: (start: Date | null, end: Date | null) => void;
  clearFilters: () => void;
  
  // Filtered data
  filteredOrders: Order[];
  
  // Stats
  totalCount: number;
  filteredCount: number;
}

const initialFilters: OrderFilters = {
  searchTerm: '',
  statusFilter: 'all',
  dateRange: {
    start: null,
    end: null
  }
};

/**
 * @deprecated Use useOrderUI instead for better functionality
 * 
 * Migration example:
 * ```typescript
 * // OLD:
 * const { filteredOrders, setSearchTerm } = useOrderFilters(orders);
 * 
 * // NEW (recommended):
 * const { filteredOrders, updateFilters } = useOrderUI(orders);
 * // updateFilters({ search: 'new search term' });
 * ```
 */
export const useOrderFilters = (orders: Order[]): UseOrderFiltersReturn => {
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);

  console.warn(
    'useOrderFilters is deprecated. Use useOrderUI instead for better functionality including selection and pagination.'
  );

  // Filter actions
  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setStatusFilter = useCallback((status: OrderStatus | 'all') => {
    setFilters(prev => ({ ...prev, statusFilter: status }));
  }, []);

  const setDateRange = useCallback((start: Date | null, end: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // Apply filters
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Apply search filter
    if (filters.searchTerm.trim()) {
      result = searchOrders(result, filters.searchTerm);
    }

    // Apply status filter
    if (filters.statusFilter !== 'all') {
      result = filterOrdersByStatus(result, filters.statusFilter);
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter(order => {
        const orderDate = new Date(order.tanggal);
        
        if (filters.dateRange.start && orderDate < filters.dateRange.start) {
          return false;
        }
        
        if (filters.dateRange.end && orderDate > filters.dateRange.end) {
          return false;
        }
        
        return true;
      });
    }

    return result;
  }, [orders, filters]);

  return {
    filters,
    setSearchTerm,
    setStatusFilter,
    setDateRange,
    clearFilters,
    filteredOrders,
    totalCount: orders.length,
    filteredCount: filteredOrders.length
  };
};