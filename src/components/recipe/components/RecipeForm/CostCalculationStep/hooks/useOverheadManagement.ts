// src/components/recipe/components/RecipeForm/CostCalculationStep/hooks/useOverheadManagement.ts

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOperationalCostRefactored } from '@/components/operational-costs/context/OperationalCostContextRefactored';
import { productionOutputApi } from '@/components/operational-costs/services/productionOutputApi';
import type { OverheadCalculation } from '../utils/types';
import { logger } from '@/utils/logger';

interface UseOverheadManagementProps {
  ingredientCost: number;
  jumlah_porsi: number;
  currentOverheadCost?: number;
  onOverheadUpdate: (value: number) => void;
}

interface UseOverheadManagementReturn {
  isUsingAutoOverhead: boolean;
  isCalculating: boolean;
  error: string | null;
  overheadCalculation: OverheadCalculation | null;
  isAuthenticated: boolean;
  toggleOverheadMode: () => void;
  refreshOverheadCalculation: () => Promise<void>;
  setManualOverhead: (value: number) => void;
}

export const useOverheadManagement = ({
  ingredientCost,
  jumlah_porsi,
  currentOverheadCost = 0,
  onOverheadUpdate,
}: UseOverheadManagementProps): UseOverheadManagementReturn => {
  
  const { 
    state: { 
      overheadCalculation, 
      loading: overheadLoading, 
      error: overheadError,
      isAuthenticated 
    },
    actions: { calculateOverhead, setError: clearOverheadError }
  } = useOperationalCostRefactored();

  const [isUsingAutoOverhead, setIsUsingAutoOverhead] = useState(true);
  const [lastCalculatedOverhead, setLastCalculatedOverhead] = useState<number>(0);

  // ✅ Subscribe to production target changes for auto-refresh
  const productionTargetQuery = useQuery({
    queryKey: ['operational-costs', 'production-target'],
    queryFn: async () => {
      const response = await productionOutputApi.getCurrentProductionTarget();
      if (response.error) {
        logger.error('❌ Error fetching production target in overhead management:', response.error);
        return null;
      }
      logger.debug('✅ Production target fetched in overhead management:', response.data);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Auto-calculate overhead when ingredients change
  useEffect(() => {
    if (isUsingAutoOverhead && isAuthenticated && ingredientCost > 0) {
      calculateOverhead(ingredientCost);
    }
  }, [ingredientCost, isUsingAutoOverhead, isAuthenticated, calculateOverhead]);

  // ✅ Auto-recalculate overhead when production target changes
  useEffect(() => {
    if (isUsingAutoOverhead && isAuthenticated && ingredientCost > 0 && productionTargetQuery.data) {
      logger.info('🎯 Production target changed in overhead management, recalculating:', productionTargetQuery.data);
      calculateOverhead(ingredientCost);
    }
  }, [productionTargetQuery.data, isUsingAutoOverhead, isAuthenticated, ingredientCost, calculateOverhead]);

  // Auto-populate overhead when calculation completes
  useEffect(() => {
    if (isUsingAutoOverhead && overheadCalculation?.overhead_per_unit) {
      const overheadPerUnit = overheadCalculation.overhead_per_unit;
      const totalOverheadForBatch = overheadPerUnit * jumlah_porsi;
      
      // Only update if different from current value
      if (Math.abs(totalOverheadForBatch - currentOverheadCost) > 0.01) {
        setLastCalculatedOverhead(overheadPerUnit);
        onOverheadUpdate(totalOverheadForBatch);
      }
    }
  }, [overheadCalculation, isUsingAutoOverhead, jumlah_porsi, currentOverheadCost]); // Removed onOverheadUpdate to prevent infinite re-renders

  // Toggle between auto and manual mode
  const toggleOverheadMode = useCallback(() => {
    if (isUsingAutoOverhead) {
      // Switching to manual mode
      setIsUsingAutoOverhead(false);
      // clearOverheadError(); // Removed to fix dependency issues
    } else {
      // Switching to auto mode
      setIsUsingAutoOverhead(true);
      if (overheadCalculation?.overhead_per_unit) {
        const totalOverheadForBatch = overheadCalculation.overhead_per_unit * jumlah_porsi;
        onOverheadUpdate(totalOverheadForBatch);
      }
    }
  }, [isUsingAutoOverhead, overheadCalculation, jumlah_porsi, onOverheadUpdate]);

  // Manually refresh overhead calculation
  const refreshOverheadCalculation = useCallback(async () => {
    if (isAuthenticated && ingredientCost > 0) {
      await calculateOverhead(ingredientCost);
    }
  }, [isAuthenticated, ingredientCost, calculateOverhead]);

  // Set manual overhead value
  const setManualOverhead = useCallback((value: number) => {
    // Switch to manual mode if user manually edits and value differs from auto-calculated
    if (isUsingAutoOverhead && overheadCalculation?.overhead_per_unit) {
      const expectedAutoValue = overheadCalculation.overhead_per_unit * jumlah_porsi;
      if (Math.abs(value - expectedAutoValue) > 0.01) {
        setIsUsingAutoOverhead(false);
      }
    }
    onOverheadUpdate(value);
  }, [isUsingAutoOverhead, overheadCalculation, jumlah_porsi, onOverheadUpdate]);

  return {
    isUsingAutoOverhead,
    isCalculating: Boolean(overheadLoading),
    error: overheadError,
    overheadCalculation: overheadCalculation as any, // Type cast to fix compatibility
    isAuthenticated,
    toggleOverheadMode,
    refreshOverheadCalculation,
    setManualOverhead,
  };
};