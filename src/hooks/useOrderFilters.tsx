// src/components/orders/hooks/useOrderFilters.ts
import { useState, useMemo, useCallback } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Order, OrderFilters, DateRange } from '../types';
import { filterOrders } from '../utils';

export interface UseOrderFiltersResult {
  filters: OrderFilters;
  filteredOrders: Order[];
  hasActiveFilters: boolean;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setDateRange: (range: DateRange | undefined) => void;
  updateFilters: (updates: Partial<OrderFilters>) => void;
  clearFilters: () => void;
}

const defaultDateRange: DateRange = {
  from: startOfDay(subDays(new Date(), 30)),
  to: endOfDay(new Date())
};

export const useOrderFilters = (orders: Order[]): UseOrderFiltersResult => {
  const [filters, setFilters] = useState<OrderFilters>({
    searchTerm: '',
    statusFilter: 'all',
    dateRange: defaultDateRange
  });

  const filteredOrders = useMemo(() => {
    return filterOrders(orders, filters);
  }, [orders, filters]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.searchTerm || 
      filters.statusFilter !== 'all' || 
      filters.dateRange
    );
  }, [filters]);

  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, statusFilter: status }));
  }, []);

  const setDateRange = useCallback((range: DateRange | undefined) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  }, []);

  const updateFilters = useCallback((updates: Partial<OrderFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      dateRange: undefined
    });
  }, []);

  return {
    filters,
    filteredOrders,
    hasActiveFilters,
    setSearchTerm,
    setStatusFilter,
    setDateRange,
    updateFilters,
    clearFilters
  };
};