// src/components/orders/hooks/useOrderFilters.ts - FIXED VERSION
import { useState, useMemo, useCallback } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Order, OrderFilters, DateRange } from '../types/order';
import { filterOrders } from '../utils/filterUtils';
import { safeParseDate, isValidDate } from '@/utils/unifiedDateUtils';

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

// 🔧 FIX: Safe default date range creation
const createSafeDefaultDateRange = (): DateRange | undefined => {
  try {
    const today = new Date();
    
    // Validate that today is a valid date
    if (!isValidDate(today)) {
      console.warn('useOrderFilters: System date is invalid, using undefined range');
      return undefined;
    }
    
    const fromDate = startOfDay(subDays(today, 30));
    const toDate = endOfDay(today);
    
    // Double-check the created dates are valid
    if (!isValidDate(fromDate) || !isValidDate(toDate)) {
      console.warn('useOrderFilters: Generated default dates are invalid');
      return undefined;
    }
    
    return {
      from: fromDate,
      to: toDate
    };
  } catch (error) {
    console.error('useOrderFilters: Error creating default date range:', error);
    return undefined;
  }
};

// 🔧 FIX: Create default range safely
const defaultDateRange = createSafeDefaultDateRange();

export const useOrderFilters = (orders: Order[]): UseOrderFiltersResult => {
  const [filters, setFilters] = useState<OrderFilters>({
    searchTerm: '',
    statusFilter: 'all',
    dateRange: defaultDateRange // This might be undefined now, which is safe
  });

  // 🔧 FIX: Safe filtering with error handling
  const filteredOrders = useMemo(() => {
    try {
      // Validate orders array
      if (!Array.isArray(orders)) {
        console.warn('useOrderFilters: Orders is not an array:', orders);
        return [];
      }
      
      return filterOrders(orders, filters);
    } catch (error) {
      console.error('useOrderFilters: Error filtering orders:', error);
      // Return original orders as fallback
      return Array.isArray(orders) ? orders : [];
    }
  }, [orders, filters]);

  // 🔧 FIX: Safe active filters detection
  const hasActiveFilters = useMemo(() => {
    try {
      return !!(
        (filters.searchTerm && filters.searchTerm.trim()) || 
        (filters.statusFilter && filters.statusFilter !== 'all') || 
        filters.dateRange
      );
    } catch (error) {
      console.warn('useOrderFilters: Error checking active filters:', error);
      return false;
    }
  }, [filters]);

  // 🔧 FIX: Safe setters with validation
  const setSearchTerm = useCallback((term: string) => {
    try {
      // Validate input
      const safeTerm = typeof term === 'string' ? term : '';
      setFilters(prev => ({ ...prev, searchTerm: safeTerm }));
    } catch (error) {
      console.error('useOrderFilters: Error setting search term:', error);
    }
  }, []);

  const setStatusFilter = useCallback((status: string) => {
    try {
      // Validate input
      const safeStatus = typeof status === 'string' ? status : 'all';
      setFilters(prev => ({ ...prev, statusFilter: safeStatus }));
    } catch (error) {
      console.error('useOrderFilters: Error setting status filter:', error);
    }
  }, []);

  const setDateRange = useCallback((range: DateRange | undefined) => {
    try {
      // Validate date range if provided
      if (range) {
        const { from, to } = range;
        
        // Check if dates are valid
        const fromDate = safeParseDate(from);
        const toDate = to ? safeParseDate(to) : null;
        
        if (from && !fromDate) {
          console.warn('useOrderFilters: Invalid from date provided:', from);
          // Don't update if from date is invalid
          return;
        }
        
        if (to && !toDate) {
          console.warn('useOrderFilters: Invalid to date provided:', to);
          // Use only from date if to date is invalid
          setFilters(prev => ({ 
            ...prev, 
            dateRange: { from: fromDate!, to: undefined } 
          }));
          return;
        }
        
        // Both dates are valid or properly undefined
        setFilters(prev => ({ ...prev, dateRange: range }));
      } else {
        // Clear date range
        setFilters(prev => ({ ...prev, dateRange: undefined }));
      }
    } catch (error) {
      console.error('useOrderFilters: Error setting date range:', error);
    }
  }, []);

  const updateFilters = useCallback((updates: Partial<OrderFilters>) => {
    try {
      // Validate updates object
      if (!updates || typeof updates !== 'object') {
        console.warn('useOrderFilters: Invalid updates object:', updates);
        return;
      }
      
      // Apply updates safely
      setFilters(prev => {
        const newFilters = { ...prev };
        
        // Validate each update
        if ('searchTerm' in updates) {
          newFilters.searchTerm = typeof updates.searchTerm === 'string' 
            ? updates.searchTerm 
            : prev.searchTerm;
        }
        
        if ('statusFilter' in updates) {
          newFilters.statusFilter = typeof updates.statusFilter === 'string' 
            ? updates.statusFilter 
            : prev.statusFilter;
        }
        
        if ('dateRange' in updates) {
          newFilters.dateRange = updates.dateRange;
        }
        
        return newFilters;
      });
    } catch (error) {
      console.error('useOrderFilters: Error updating filters:', error);
    }
  }, []);

  const clearFilters = useCallback(() => {
    try {
      setFilters({
        searchTerm: '',
        statusFilter: 'all',
        dateRange: undefined // 🔧 FIX: Use undefined instead of potentially invalid default
      });
    } catch (error) {
      console.error('useOrderFilters: Error clearing filters:', error);
    }
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