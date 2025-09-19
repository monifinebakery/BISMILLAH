// src/components/operational-costs/hooks/useOverheadCalculation.ts

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { OverheadCalculation } from '../types';
import { calculationApi, productionOutputApi } from '../services';
import { OPERATIONAL_COST_QUERY_KEYS } from './useOperationalCostQuery';
import { logger } from '@/utils/logger';

interface UseOverheadCalculationProps {
  isAuthenticated: boolean;
  onError?: (error: string) => void;
}

export const useOverheadCalculation = ({
  isAuthenticated,
  onError
}: UseOverheadCalculationProps) => {
  
  const [overheadCalculation, setOverheadCalculation] = useState<OverheadCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const queryClient = useQueryClient();

  // Manual overhead calculation with useQuery pattern
  const calculateOverhead = useCallback(async (materialCost: number = 0) => {
    if (!isAuthenticated) {
      logger.warn('🔐 Overhead calculation attempted without authentication');
      if (onError) {
        onError('Silakan login terlebih dahulu');
      }
      return;
    }

    try {
      logger.info('🔄 Calculating overhead with material cost:', materialCost);
      setIsCalculating(true);
      
      // Get current production target for query key consistency
      const targetResponse = await productionOutputApi.getCurrentProductionTarget();
      const currentTarget = targetResponse.data || 1000;
      
      logger.debug('🎯 Using production target for calculation:', currentTarget);
      
      // Use queryClient.fetchQuery for manual triggering
      const data = await queryClient.fetchQuery({
        queryKey: OPERATIONAL_COST_QUERY_KEYS.overheadCalculation(materialCost, currentTarget),
        queryFn: async () => {
          const response = await calculationApi.calculateOverhead(materialCost);
          if (response.error) {
            throw new Error(response.error);
          }
          return response.data;
        },
        staleTime: 30 * 1000, // 30 seconds - overhead calculation can change frequently
        retry: 2,
      });

      logger.success('✅ Overhead calculated successfully:', data?.overhead_per_unit);
      setOverheadCalculation(data);
      return data;
    } catch (error) {
      logger.error('❌ Error calculating overhead:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Gagal menghitung overhead');
      }
      throw error;
    } finally {
      setIsCalculating(false);
    }
  }, [isAuthenticated, queryClient, onError]);

  // Invalidate overhead calculations
  const invalidateOverheadCalculations = useCallback(() => {
    logger.info('🔄 Manually invalidating overhead calculations');
    
    // Comprehensive invalidation for real-time updates
    const invalidationPromises = [
      // All operational cost queries
      queryClient.invalidateQueries({ queryKey: ['operational-costs'] }),
      
      // All overhead calculation queries
      queryClient.invalidateQueries({ queryKey: ['operational-costs', 'overhead-calculation'] }),
      
      // Allocation settings
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.allocationSettings() }),
      
      // Production target
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.productionTarget() }),
      
      // Recipe overhead calculations
      queryClient.invalidateQueries({ queryKey: ['recipe-overhead'] }),
      
      // App settings
      queryClient.invalidateQueries({ queryKey: ['app-settings'] }),
      
      // Enhanced HPP calculations
      queryClient.invalidateQueries({ queryKey: ['enhanced-hpp'] }),
    ];
    
    // Execute all invalidations
    Promise.all(invalidationPromises).then(() => {
      logger.success('✅ All overhead-related queries invalidated');
    });
  }, [queryClient]);

  // Get cached overhead calculation
  const getCachedOverhead = useCallback((materialCost: number = 0, productionTarget: number = 1000) => {
    const queryKey = OPERATIONAL_COST_QUERY_KEYS.overheadCalculation(materialCost, productionTarget);
    return queryClient.getQueryData<OverheadCalculation>(queryKey);
  }, [queryClient]);

  // Prefetch overhead calculation
  const prefetchOverhead = useCallback(async (materialCost: number = 0) => {
    if (!isAuthenticated) return;

    try {
      // Get current production target
      const targetResponse = await productionOutputApi.getCurrentProductionTarget();
      const currentTarget = targetResponse.data || 1000;
      
      await queryClient.prefetchQuery({
        queryKey: OPERATIONAL_COST_QUERY_KEYS.overheadCalculation(materialCost, currentTarget),
        queryFn: async () => {
          const response = await calculationApi.calculateOverhead(materialCost);
          if (response.error) {
            throw new Error(response.error);
          }
          return response.data;
        },
        staleTime: 30 * 1000,
      });
      
      logger.debug('✅ Overhead calculation prefetched for material cost:', materialCost);
    } catch (error) {
      logger.error('❌ Error prefetching overhead:', error);
    }
  }, [isAuthenticated, queryClient]);

  // Clear current calculation
  const clearOverheadCalculation = useCallback(() => {
    setOverheadCalculation(null);
    logger.debug('🧹 Overhead calculation cleared');
  }, []);

  // Check if calculation is stale
  const isCalculationStale = useCallback((materialCost: number = 0, productionTarget: number = 1000) => {
    const queryKey = OPERATIONAL_COST_QUERY_KEYS.overheadCalculation(materialCost, productionTarget);
    const query = queryClient.getQueryState(queryKey);
    
    if (!query) return true;
    
    const staleTime = 30 * 1000; // 30 seconds
    const isStale = Date.now() - (query.dataUpdatedAt || 0) > staleTime;
    
    return isStale;
  }, [queryClient]);

  return {
    // State
    overheadCalculation,
    isCalculating,
    
    // Actions
    calculateOverhead,
    invalidateOverheadCalculations,
    clearOverheadCalculation,
    
    // Helpers
    getCachedOverhead,
    prefetchOverhead,
    isCalculationStale,
    
    // Computed values
    hasCalculation: !!overheadCalculation,
    overheadPerUnit: overheadCalculation?.overhead_per_unit || 0,
    totalOverhead: overheadCalculation?.total_overhead || 0,
  };
};