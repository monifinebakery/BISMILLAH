// src/components/operational-costs/context/OperationalCostContextRefactored.tsx

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import type {
  OperationalCost,
  AllocationSettings,
  CostSummary,
  CostFilters,
  CostFormData,
  AllocationFormData,
  OverheadCalculation
} from '../types';
import {
  useOperationalCostQuery,
  useOperationalCostMutation,
  useOperationalCostFilters,
  useOperationalCostAuth,
  useOverheadCalculation,
  OPERATIONAL_COST_QUERY_KEYS
} from '../hooks';
import { logger } from '@/utils/logger';

// Context interface - maintain backward compatibility
interface OperationalCostContextType {
  state: {
    costs: OperationalCost[];
    allocationSettings: AllocationSettings | null;
    summary: CostSummary;
    overheadCalculation: OverheadCalculation | null;
    filters: CostFilters;
    loading: {
      costs: boolean;
      allocation: boolean;
      summary: boolean;
      overhead: boolean;
      auth: boolean;
    };
    error: string | null;
    isAuthenticated: boolean;
  };
  actions: {
    loadCosts: (filters?: CostFilters) => Promise<void>;
    createCost: (data: CostFormData) => Promise<boolean>;
    updateCost: (id: string, data: Partial<CostFormData>) => Promise<boolean>;
    deleteCost: (id: string) => Promise<boolean>;
    loadAllocationSettings: () => Promise<void>;
    saveAllocationSettings: (data: AllocationFormData) => Promise<boolean>;
    calculateOverhead: (materialCost?: number) => Promise<void>;
    updateProductionTarget: (targetPcs: number) => Promise<boolean>;
    invalidateOverheadCalculations: () => void;
    setFilters: (filters: CostFilters) => void;
    clearFilters: () => void;
    refreshData: () => Promise<void>;
    setError: (error: string | null) => void;
  };
}

// Create context
const OperationalCostContextRefactored = createContext<OperationalCostContextType | undefined>(undefined);

// Provider component
interface OperationalCostProviderRefactoredProps {
  children: React.ReactNode;
}

export const OperationalCostProviderRefactored: React.FC<OperationalCostProviderRefactoredProps> = ({ 
  children 
}) => {
  
  // Authentication hook
  const auth = useOperationalCostAuth();

  // Filter management hook
  const filterManager = useOperationalCostFilters({
    initialFilters: {},
    onFiltersChange: (filters) => {
      logger.debug('📊 Filters changed:', filters);
    }
  });

  // Query hook for data fetching
  const query = useOperationalCostQuery({
    filters: filterManager.filters,
    isAuthenticated: auth.isAuthenticated
  });

  // Mutation hook for CRUD operations
  const mutations = useOperationalCostMutation({
    isAuthenticated: auth.isAuthenticated,
    onError: (error) => {
      logger.error('❌ Mutation error:', error);
    }
  });

  // Overhead calculation hook
  const overhead = useOverheadCalculation({
    isAuthenticated: auth.isAuthenticated,
    onError: (error) => {
      logger.error('❌ Overhead calculation error:', error);
    }
  });

  // Debug logging
  logger.debug('🔍 OperationalCostProviderRefactored rendered', {
    filters: filterManager.filters,
    isAuthenticated: auth.isAuthenticated,
    costsCount: query.costs.length
  });

  // Legacy wrapper functions for backward compatibility
  const loadCosts = useCallback(async (filters?: CostFilters) => {
    logger.info('🔄 loadCosts called with filters:', filters);
    if (filters) {
      filterManager.updateFilters(filters);
    }
    await query.refreshCosts();
  }, [filterManager, query]);

  const loadAllocationSettings = useCallback(async () => {
    logger.info('🔄 loadAllocationSettings called');
    await query.refreshAllocationSettings();
  }, [query]);

  const calculateOverheadWrapper = useCallback(async (materialCost?: number) => {
    await overhead.calculateOverhead(materialCost || 0);
  }, [overhead]);

  const refreshData = useCallback(async () => {
    if (!auth.isAuthenticated) {
      logger.warn('🔐 Refresh data attempted without authentication');
      return;
    }
    
    logger.info('🔄 Refreshing all data');
    await query.refreshAll();
  }, [auth.isAuthenticated, query]);

  const setError = useCallback((error: string | null) => {
    if (error) {
      logger.error('❌ Error set:', error);
    } else {
      logger.debug('✅ Error cleared');
    }
    // In the refactored version, errors are handled by individual hooks
    // This is kept for backward compatibility but doesn't store centralized error
  }, []);

  // Enhanced state combining all hooks
  const enhancedState = useMemo(() => {
    const combinedError = query.error.costs || 
                         query.error.allocation || 
                         null;

    return {
      costs: query.costs,
      allocationSettings: query.allocationSettings,
      summary: query.summary,
      overheadCalculation: overhead.overheadCalculation,
      filters: filterManager.filters,
      loading: {
        costs: query.loading.costs,
        allocation: query.loading.allocation,
        summary: false, // Summary is calculated synchronously
        overhead: overhead.isCalculating,
        auth: auth.isInitializing,
      },
      error: combinedError,
      isAuthenticated: auth.isAuthenticated,
    };
  }, [
    query.costs,
    query.allocationSettings, 
    query.summary,
    query.loading,
    query.error,
    overhead.overheadCalculation,
    overhead.isCalculating,
    filterManager.filters,
    auth.isAuthenticated,
    auth.isInitializing
  ]);

  // Context value
  const contextValue: OperationalCostContextType = useMemo(() => ({
    state: enhancedState,
    actions: {
      loadCosts,
      createCost: mutations.actions.createCost,
      updateCost: mutations.actions.updateCost,
      deleteCost: mutations.actions.deleteCost,
      loadAllocationSettings,
      saveAllocationSettings: mutations.actions.saveAllocationSettings,
      calculateOverhead: calculateOverheadWrapper,
      updateProductionTarget: mutations.actions.updateProductionTarget,
      invalidateOverheadCalculations: overhead.invalidateOverheadCalculations,
      setFilters: filterManager.updateFilters,
      clearFilters: filterManager.clearFilters,
      refreshData,
      setError,
    },
  }), [
    enhancedState,
    loadCosts,
    mutations.actions,
    loadAllocationSettings,
    calculateOverheadWrapper,
    overhead.invalidateOverheadCalculations,
    filterManager.updateFilters,
    filterManager.clearFilters,
    refreshData,
    setError,
  ]);

  logger.debug('🎯 Context value prepared:', {
    costsCount: enhancedState.costs.length,
    hasAllocationSettings: !!enhancedState.allocationSettings,
    loadingStates: enhancedState.loading,
    hasError: !!enhancedState.error
  });

  return (
    <OperationalCostContextRefactored.Provider value={contextValue}>
      {children}
    </OperationalCostContextRefactored.Provider>
  );
};

// Hook to use the refactored context
export const useOperationalCostRefactored = () => {
  const context = useContext(OperationalCostContextRefactored);
  if (context === undefined) {
    throw new Error('useOperationalCostRefactored must be used within an OperationalCostProviderRefactored');
  }
  return context;
};

// Export context for testing
export { OperationalCostContextRefactored };