// src/components/operational-costs/hooks/useOperationalCostFilters.ts

import { useState, useCallback, useMemo } from 'react';
import type { CostFilters } from '../types';
import { logger } from '@/utils/logger';

interface UseOperationalCostFiltersProps {
  initialFilters?: CostFilters;
  onFiltersChange?: (filters: CostFilters) => void;
}

export const useOperationalCostFilters = ({
  initialFilters = {},
  onFiltersChange
}: UseOperationalCostFiltersProps = {}) => {
  
  const [filters, setFilters] = useState<CostFilters>(initialFilters);

  // Memoized string representation for comparison
  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  // Set filters with change detection
  const updateFilters = useCallback((newFilters: CostFilters) => {
    const newFiltersString = JSON.stringify(newFilters);
    
    if (newFiltersString !== filtersString) {
      logger.info('📊 Setting new filters:', newFilters);
      setFilters(newFilters);
      
      if (onFiltersChange) {
        onFiltersChange(newFilters);
      }
    } else {
      logger.debug('📊 Filters unchanged, skipping update');
    }
  }, [filtersString, onFiltersChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    logger.info('📊 Clearing all filters');
    setFilters({});
    
    if (onFiltersChange) {
      onFiltersChange({});
    }
  }, [onFiltersChange]);

  // Set specific filter field
  const setFilter = useCallback((key: keyof CostFilters, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    
    // Remove undefined/null values
    if (value === undefined || value === null || value === '') {
      delete newFilters[key];
    }
    
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  // Remove specific filter field
  const removeFilter = useCallback((key: keyof CostFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0;
  }, [filters]);

  // Get filter count
  const filterCount = useMemo(() => {
    return Object.keys(filters).length;
  }, [filters]);

  // Get specific filter values
  const getFilter = useCallback((key: keyof CostFilters) => {
    return filters[key];
  }, [filters]);

  // Batch update multiple filters
  const batchUpdateFilters = useCallback((updates: Partial<CostFilters>) => {
    const newFilters = {
      ...filters,
      ...updates
    };
    
    // Remove undefined/null values
    Object.keys(newFilters).forEach(key => {
      const value = newFilters[key as keyof CostFilters];
      if (value === undefined || value === null || value === '') {
        delete newFilters[key as keyof CostFilters];
      }
    });
    
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  // Reset to initial filters
  const resetToInitial = useCallback(() => {
    logger.info('📊 Resetting filters to initial state:', initialFilters);
    setFilters(initialFilters);
    
    if (onFiltersChange) {
      onFiltersChange(initialFilters);
    }
  }, [initialFilters, onFiltersChange]);

  return {
    // Current state
    filters,
    filtersString,
    hasActiveFilters,
    filterCount,
    
    // Actions
    updateFilters,
    clearFilters,
    setFilter,
    removeFilter,
    getFilter,
    batchUpdateFilters,
    resetToInitial,
  };
};