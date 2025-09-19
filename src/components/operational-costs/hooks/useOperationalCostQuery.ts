// src/components/operational-costs/hooks/useOperationalCostQuery.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CostFilters, OperationalCost, AllocationSettings } from '../types';
import { operationalCostApi, allocationApi } from '../services';
import { transformCostsToSummary } from '../utils/costTransformers';
import { logger } from '@/utils/logger';

// Query Keys
export const OPERATIONAL_COST_QUERY_KEYS = {
  costs: (filters?: CostFilters) => ['operational-costs', 'costs', filters],
  allocationSettings: () => ['operational-costs', 'allocation-settings'],
  overheadCalculation: (materialCost?: number, productionTarget?: number) => [
    'operational-costs', 
    'overhead-calculation', 
    materialCost, 
    productionTarget
  ],
  productionTarget: () => ['operational-costs', 'production-target'],
} as const;

interface UseOperationalCostQueryProps {
  filters: CostFilters;
  isAuthenticated: boolean;
}

export const useOperationalCostQuery = ({
  filters,
  isAuthenticated
}: UseOperationalCostQueryProps) => {
  const queryClient = useQueryClient();

  // Stabilize filters to prevent unnecessary re-renders
  const stabilizedFilters = useMemo(() => {
    logger.debug('📊 Filters stabilized:', filters);
    return filters;
  }, [filters]);

  // Load Costs Query
  const costsQuery = useQuery({
    queryKey: OPERATIONAL_COST_QUERY_KEYS.costs(stabilizedFilters),
    queryFn: async () => {
      logger.info('🔄 Fetching costs with filters:', stabilizedFilters);
      const response = await operationalCostApi.getCosts(stabilizedFilters);
      if (response.error) {
        logger.error('❌ Error fetching costs:', response.error);
        throw new Error(response.error);
      }
      logger.debug('✅ Costs fetched successfully:', response.data?.length || 0);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Load Allocation Settings Query
  const allocationQuery = useQuery({
    queryKey: OPERATIONAL_COST_QUERY_KEYS.allocationSettings(),
    queryFn: async () => {
      logger.info('🔄 Fetching allocation settings');
      const response = await allocationApi.getSettings();
      if (response.error && !response.error.includes('tidak ditemukan')) {
        logger.error('❌ Error fetching allocation settings:', response.error);
        throw new Error(response.error);
      }
      logger.success('✅ Allocation settings fetched:', !!response.data);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Calculate summary from costs query data
  const summary = useMemo(() => {
    const costs = costsQuery.data || [];
    const calculatedSummary = transformCostsToSummary(costs);
    logger.debug('📊 Summary calculated:', calculatedSummary);
    return calculatedSummary;
  }, [costsQuery.data]);

  // Refresh functions
  const refreshCosts = async () => {
    logger.info('🔄 Refreshing costs');
    await costsQuery.refetch();
  };

  const refreshAllocationSettings = async () => {
    logger.info('🔄 Refreshing allocation settings');
    await allocationQuery.refetch();
  };

  const refreshAll = async () => {
    logger.info('🔄 Refreshing all data');
    await Promise.all([
      costsQuery.refetch(),
      allocationQuery.refetch(),
    ]);
  };

  // Invalidation helpers
  const invalidateCosts = () => {
    logger.info('🔄 Invalidating costs queries');
    queryClient.invalidateQueries({ queryKey: ['operational-costs', 'costs'] });
  };

  const invalidateAllocation = () => {
    logger.info('🔄 Invalidating allocation queries');
    queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.allocationSettings() });
  };

  const invalidateOverheadCalculations = () => {
    logger.info('🔄 Invalidating overhead calculations');
    queryClient.invalidateQueries({ queryKey: ['operational-costs', 'overhead-calculation'] });
  };

  const invalidateAll = () => {
    logger.info('🔄 Invalidating all operational cost queries');
    queryClient.invalidateQueries({ queryKey: ['operational-costs'] });
  };

  return {
    // Query results
    costs: costsQuery.data || [],
    allocationSettings: allocationQuery.data || null,
    summary,
    
    // Loading states
    loading: {
      costs: costsQuery.isLoading,
      allocation: allocationQuery.isLoading,
    },
    
    // Error states
    error: {
      costs: costsQuery.error?.message || null,
      allocation: allocationQuery.error?.message || null,
    },
    
    // Query objects for advanced usage
    costsQuery,
    allocationQuery,
    
    // Refresh functions
    refreshCosts,
    refreshAllocationSettings,
    refreshAll,
    
    // Invalidation helpers
    invalidateCosts,
    invalidateAllocation,
    invalidateOverheadCalculations,
    invalidateAll,
    
    // Query client access
    queryClient
  };
};