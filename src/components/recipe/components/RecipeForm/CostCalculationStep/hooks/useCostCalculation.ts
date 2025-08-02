// src/components/recipe/components/RecipeForm/CostCalculationStep/hooks/useCostCalculation.ts

import { useMemo } from 'react';
import type { CostCalculationData, CostBreakdown, ProfitAnalysis, ValidationErrors } from '../utils/types';
import { 
  calculateCostBreakdown, 
  calculateProfitAnalysis, 
  calculateBreakEvenPoint,
  getCostDistribution,
  getDominantCostComponent,
  validateCostData
} from '../utils/calculations';

interface UseCostCalculationReturn {
  costBreakdown: CostBreakdown;
  profitAnalysis: ProfitAnalysis;
  breakEvenPoint: number;
  costDistribution: {
    ingredientPercent: number;
    laborPercent: number;
    overheadPercent: number;
  };
  dominantCostComponent: string;
  validationErrors: ValidationErrors;
  totalRevenue: number;
  isDataValid: boolean;
}

export const useCostCalculation = (data: CostCalculationData): UseCostCalculationReturn => {
  // Calculate cost breakdown
  const costBreakdown = useMemo(() => {
    return calculateCostBreakdown(data);
  }, [data.bahanResep, data.biayaTenagaKerja, data.biayaOverhead, data.jumlahPorsi, data.jumlahPcsPerPorsi]);

  // Calculate profit analysis
  const profitAnalysis = useMemo(() => {
    return calculateProfitAnalysis(costBreakdown, data);
  }, [costBreakdown, data.marginKeuntunganPersen, data.jumlahPorsi, data.jumlahPcsPerPorsi]);

  // Calculate break-even point
  const breakEvenPoint = useMemo(() => {
    return calculateBreakEvenPoint(costBreakdown.totalProductionCost, profitAnalysis.profitPerPortion);
  }, [costBreakdown.totalProductionCost, profitAnalysis.profitPerPortion]);

  // Get cost distribution percentages
  const costDistribution = useMemo(() => {
    return getCostDistribution(costBreakdown);
  }, [costBreakdown]);

  // Get dominant cost component
  const dominantCostComponent = useMemo(() => {
    return getDominantCostComponent(costBreakdown);
  }, [costBreakdown]);

  // Validate data
  const validationErrors = useMemo(() => {
    return validateCostData(data);
  }, [data.biayaTenagaKerja, data.biayaOverhead, data.marginKeuntunganPersen]);

  // Calculate total potential revenue
  const totalRevenue = useMemo(() => {
    return profitAnalysis.sellingPricePerPortion * data.jumlahPorsi;
  }, [profitAnalysis.sellingPricePerPortion, data.jumlahPorsi]);

  // Check if data is valid
  const isDataValid = useMemo(() => {
    return Object.keys(validationErrors).length === 0 && costBreakdown.totalProductionCost > 0;
  }, [validationErrors, costBreakdown.totalProductionCost]);

  return {
    costBreakdown,
    profitAnalysis,
    breakEvenPoint,
    costDistribution,
    dominantCostComponent,
    validationErrors,
    totalRevenue,
    isDataValid,
  };
};