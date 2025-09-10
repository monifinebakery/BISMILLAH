// src/components/recipe/components/RecipeForm/CostCalculationStep/hooks/useOverheadManagement.ts

import { useState, useEffect, useCallback } from 'react';
import { useOperationalCost } from '@/components/operational-costs/context/OperationalCostContext';
import type { OverheadCalculation } from '../utils/types';

interface UseOverheadManagementProps {
  ingredientCost: number;
  jumlahPorsi: number;
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
  jumlahPorsi,
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
  } = useOperationalCost();

  const [isUsingAutoOverhead, setIsUsingAutoOverhead] = useState(true);
  const [lastCalculatedOverhead, setLastCalculatedOverhead] = useState<number>(0);

  // Auto-calculate overhead when ingredients change
  useEffect(() => {
    if (isUsingAutoOverhead && isAuthenticated && ingredientCost > 0) {
      calculateOverhead(ingredientCost);
    }
  }, [ingredientCost, isUsingAutoOverhead, isAuthenticated, calculateOverhead]);

  // Auto-populate overhead when calculation completes
  useEffect(() => {
    if (isUsingAutoOverhead && overheadCalculation?.overhead_per_unit) {
      const overheadPerUnit = overheadCalculation.overhead_per_unit;
      const totalOverheadForBatch = overheadPerUnit * jumlahPorsi;
      
      // Only update if different from current value
      if (Math.abs(totalOverheadForBatch - currentOverheadCost) > 0.01) {
        setLastCalculatedOverhead(overheadPerUnit);
        onOverheadUpdate(totalOverheadForBatch);
      }
    }
  }, [overheadCalculation, isUsingAutoOverhead, jumlahPorsi, currentOverheadCost]); // Removed onOverheadUpdate to prevent infinite re-renders

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
        const totalOverheadForBatch = overheadCalculation.overhead_per_unit * jumlahPorsi;
        onOverheadUpdate(totalOverheadForBatch);
      }
    }
  }, [isUsingAutoOverhead, overheadCalculation, jumlahPorsi, onOverheadUpdate]);

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
      const expectedAutoValue = overheadCalculation.overhead_per_unit * jumlahPorsi;
      if (Math.abs(value - expectedAutoValue) > 0.01) {
        setIsUsingAutoOverhead(false);
      }
    }
    onOverheadUpdate(value);
  }, [isUsingAutoOverhead, overheadCalculation, jumlahPorsi, onOverheadUpdate]);

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