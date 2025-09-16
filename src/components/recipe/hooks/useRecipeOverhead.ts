// src/components/recipe/hooks/useRecipeOverhead.ts

import { useState, useEffect, useCallback } from 'react';
import { useOperationalCost } from '@/components/operational-costs/context/OperationalCostContext';
import type { OverheadCalculation } from '@/components/operational-costs/types';

interface UseRecipeOverheadReturn {
  // State
  overheadCalculation: OverheadCalculation | null;
  overheadPerUnit: number;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // Auto-calculation modes
  isAutoMode: boolean;
  setAutoMode: (enabled: boolean) => void;
  
  // Calculation methods
  calculateOverheadForIngredients: (ingredientCost: number) => Promise<void>;
  calculateOverheadForBatch: (ingredientCost: number, batchSize: number) => Promise<number>;
  getOverheadForRecipe: (ingredientCost: number, portionCount: number) => Promise<number>;
  
  // Utilities
  refreshOverhead: () => Promise<void>;
  clearError: () => void;
  
  // Helper functions
  formatOverheadDisplay: (overheadPerUnit: number, portionCount: number) => {
    perUnit: string;
    totalForBatch: string;
    percentage: string;
  };
  
  // Validation
  validateOverheadCalculation: (calculation: OverheadCalculation) => {
    isValid: boolean;
    warnings: string[];
  };
}

export const useRecipeOverhead = (): UseRecipeOverheadReturn => {
  // Access Operational Cost Context
  const { 
    state: { 
      overheadCalculation, 
      loading: overheadLoading, 
      error: overheadError,
      isAuthenticated 
    },
    actions: { calculateOverhead, setError: clearOverheadError }
  } = useOperationalCost();

  // Local state
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [lastIngredientCost, setLastIngredientCost] = useState<number>(0);

  // Computed values
  const overheadPerUnit = overheadCalculation?.overhead_per_unit || 0;

  // Calculate overhead for ingredients
  const calculateOverheadForIngredients = useCallback(async (ingredientCost: number) => {
    if (!isAuthenticated || ingredientCost <= 0) return;
    
    setLastIngredientCost(ingredientCost);
    await calculateOverhead(ingredientCost);
  }, [isAuthenticated, calculateOverhead]);

  // Calculate overhead for entire batch
  const calculateOverheadForBatch = useCallback(async (
    ingredientCost: number, 
    batchSize: number
  ): Promise<number> => {
    if (!isAuthenticated || batchSize <= 0) return 0;
    
    await calculateOverheadForIngredients(ingredientCost);
    return overheadPerUnit * batchSize;
  }, [isAuthenticated, calculateOverheadForIngredients, overheadPerUnit]);

  // Get overhead specifically for recipe context
  const getOverheadForRecipe = useCallback(async (
    ingredientCost: number, 
    portionCount: number
  ): Promise<number> => {
    if (!isAuthenticated || portionCount <= 0) return 0;
    
    // First calculate the overhead per unit based on ingredients
    await calculateOverheadForIngredients(ingredientCost);
    
    // Then multiply by portion count to get total overhead for recipe
    return overheadPerUnit * portionCount;
  }, [isAuthenticated, calculateOverheadForIngredients, overheadPerUnit]);

  // Refresh overhead with last ingredient cost
  const refreshOverhead = useCallback(async () => {
    if (lastIngredientCost > 0) {
      await calculateOverheadForIngredients(lastIngredientCost);
    }
  }, [calculateOverheadForIngredients, lastIngredientCost]);

  // Set auto mode
  const setAutoMode = useCallback((enabled: boolean) => {
    setIsAutoMode(enabled);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    clearOverheadError(null);
  }, [clearOverheadError]);

  // Format overhead for display
  const formatOverheadDisplay = useCallback((
    overheadPerUnitValue: number, 
    portionCount: number
  ) => {
    const totalForBatch = overheadPerUnitValue * portionCount;
    const percentage = lastIngredientCost > 0 
      ? ((overheadPerUnitValue / lastIngredientCost) * 100).toFixed(1)
      : '0';

    return {
      perUnit: `Rp ${overheadPerUnitValue.toLocaleString('id-ID')}`,
      totalForBatch: `Rp ${totalForBatch.toLocaleString('id-ID')}`,
      percentage: `${percentage}%`
    };
  }, [lastIngredientCost]);

  // Validate overhead calculation
  const validateOverheadCalculation = useCallback((calculation: OverheadCalculation) => {
    const warnings: string[] = [];
    let isValid = true;

    // Check if overhead per unit is reasonable
    if (calculation.overhead_per_unit <= 0) {
      warnings.push('Overhead per unit adalah 0. Pastikan ada biaya operasional aktif.');
      isValid = false;
    }

    // Check if overhead is too high compared to material cost
    if (lastIngredientCost > 0 && calculation.overhead_per_unit > lastIngredientCost * 2) {
      warnings.push('Overhead sangat tinggi dibanding biaya bahan (>200%). Periksa pengaturan alokasi.');
    }

    // Check if total costs are reasonable
    if (calculation.total_costs <= 0) {
      warnings.push('Total biaya operasional adalah 0. Tambahkan biaya operasional terlebih dahulu.');
      isValid = false;
    }

    // Check allocation method
    const method = calculation.allocation_method || calculation.metode;
    const basisValue = calculation.basis_value || calculation.nilai_basis;
    
    if (method === 'per_unit' && (basisValue || 0) <= 0) {
      warnings.push('Basis alokasi per unit tidak valid. Periksa pengaturan alokasi.');
      isValid = false;
    }

    return { isValid, warnings };
  }, [lastIngredientCost]);

  // Auto-calculate when in auto mode and have ingredient cost
  useEffect(() => {
    if (isAutoMode && isAuthenticated && lastIngredientCost > 0) {
      calculateOverheadForIngredients(lastIngredientCost);
    }
  }, [isAutoMode, isAuthenticated, lastIngredientCost, calculateOverheadForIngredients]);

  return {
    // State
    overheadCalculation,
    overheadPerUnit,
    isLoading: overheadLoading,
    error: overheadError,
    isAuthenticated,
    
    // Auto-calculation modes
    isAutoMode,
    setAutoMode,
    
    // Calculation methods
    calculateOverheadForIngredients,
    calculateOverheadForBatch,
    getOverheadForRecipe,
    
    // Utilities
    refreshOverhead,
    clearError,
    
    // Helper functions
    formatOverheadDisplay,
    
    // Validation
    validateOverheadCalculation,
  };
};