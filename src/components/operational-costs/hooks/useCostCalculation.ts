// src/components/operational-costs/hooks/useCostCalculation.ts

import { useState, useCallback, useEffect } from 'react';
import { 
  OverheadCalculation, 
  AllocationSettings, 
  OperationalCost 
} from '../types';
import { calculationApi } from '../services';
import { 
  calculateTotalActiveCosts, 
  calculateOverheadPerUnit, 
  calculateHPP,
  calculateBreakEven,
  calculateEfficiency 
} from '../utils/costCalculations';

interface UseCostCalculationReturn {
  // State
  overheadCalculation: OverheadCalculation | null;
  loading: boolean;
  error: string | null;
  
  // Calculations
  calculateOverhead: (materialCost?: number) => Promise<void>;
  calculateHPPValue: (materialCost: number, laborCost: number) => number;
  calculateBreakEvenAnalysis: (
    fixedCosts: number,
    variableCostPerUnit: number,
    sellingPricePerUnit: number
  ) => {
    breakEvenUnits: number;
    breakEvenRevenue: number;
    contributionMargin: number;
    contributionMarginRatio: number;
  };
  calculateEfficiencyAnalysis: (actualCost: number, standardCost: number) => {
    variance: number;
    variancePercentage: number;
    isEfficient: boolean;
  };
  
  // Local calculations (without API)
  calculateLocalOverhead: (
    costs: OperationalCost[],
    settings: AllocationSettings,
    materialCost?: number
  ) => {
    totalCosts: number;
    overheadPerUnit: number;
    totalOverhead: number;
  };
  
  // Utilities
  refreshCalculation: () => Promise<void>;
  clearError: () => void;
}

export const useCostCalculation = (): UseCostCalculationReturn => {
  const [overheadCalculation, setOverheadCalculation] = useState<OverheadCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMaterialCost, setLastMaterialCost] = useState<number>(0);

  // Calculate overhead using API
  const calculateOverhead = useCallback(async (materialCost: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      setLastMaterialCost(materialCost);
      
      const response = await calculationApi.calculateOverhead(materialCost);
      
      if (response.error) {
        setError(response.error);
      } else {
        setOverheadCalculation(response.data);
      }
    } catch (err) {
      setError('Gagal menghitung overhead');
      console.error('Error calculating overhead:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate HPP (Harga Pokok Produksi)
  const calculateHPPValue = useCallback((materialCost: number, laborCost: number): number => {
    const overheadPerUnit = overheadCalculation?.overhead_per_unit || 0;
    return calculateHPP(materialCost, laborCost, overheadPerUnit);
  }, [overheadCalculation]);

  // Calculate break-even analysis
  const calculateBreakEvenAnalysis = useCallback((
    fixedCosts: number,
    variableCostPerUnit: number,
    sellingPricePerUnit: number
  ) => {
    return calculateBreakEven(fixedCosts, variableCostPerUnit, sellingPricePerUnit);
  }, []);

  // Calculate efficiency analysis
  const calculateEfficiencyAnalysis = useCallback((
    actualCost: number, 
    standardCost: number
  ) => {
    return calculateEfficiency(actualCost, standardCost);
  }, []);

  // Local overhead calculation (without API call)
  const calculateLocalOverhead = useCallback((
    costs: OperationalCost[],
    settings: AllocationSettings,
    materialCost: number = 0
  ) => {
    const totalCosts = calculateTotalActiveCosts(costs);
    const overheadPerUnit = calculateOverheadPerUnit(totalCosts, settings, materialCost);
    const totalOverhead = overheadPerUnit; // For 1 unit

    return {
      totalCosts,
      overheadPerUnit,
      totalOverhead,
    };
  }, []);

  // Refresh calculation with last material cost
  const refreshCalculation = useCallback(async () => {
    await calculateOverhead(lastMaterialCost);
  }, [calculateOverhead, lastMaterialCost]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    overheadCalculation,
    loading,
    error,
    
    // Calculations
    calculateOverhead,
    calculateHPPValue,
    calculateBreakEvenAnalysis,
    calculateEfficiencyAnalysis,
    
    // Local calculations
    calculateLocalOverhead,
    
    // Utilities
    refreshCalculation,
    clearError,
  };
};