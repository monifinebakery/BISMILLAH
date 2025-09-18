// src/components/recipe/components/RecipeForm/CostCalculationStep/hooks/useCostCalculation.ts
// TEMPORARY DEBUG VERSION

import { useMemo } from 'react';
import { logger } from '@/utils/logger';
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
  // 🐛 DEBUG: Log input data
  // Ganti camelCase ke snake_case
logger.debug('useCostCalculation INPUT DEBUG', {
  fullData: data,
  margin_keuntungan_persen: data.margin_keuntungan_persen,
  marginType: typeof data.margin_keuntungan_persen,
  jumlah_porsi: data.jumlah_porsi,
  bahan_resep_length: data.bahan_resep?.length,
  biaya_tenaga_kerja: data.biaya_tenaga_kerja,
  biaya_overhead: data.biaya_overhead
});

// Calculate cost breakdown
  const costBreakdown = useMemo(() => {
    logger.debug('Recalculating costBreakdown...');
    const result = calculateCostBreakdown(data);
    logger.debug('Cost breakdown result', result);
    return result;
  }, [data.bahanResep, data.biayaTenagaKerja, data.biayaOverhead, data.jumlahPorsi, data.jumlahPcsPerPorsi]);

  // Calculate profit analysis
  const profitAnalysis = useMemo(() => {
    logger.debug('Recalculating profitAnalysis...', {
      costBreakdown,
      margin_keuntungan_persen: data.margin_keuntungan_persen
    });
    
    const result = calculateProfitAnalysis(costBreakdown, data);
    
    logger.debug('Profit analysis result', {
      marginAmount: result.marginAmount,
      profitPerPortion: result.profitPerPortion,
      sellingPricePerPortion: result.sellingPricePerPortion,
      fullResult: result
    });
    
    if (result.marginAmount === 0) {
      logger.warn('MARGIN AMOUNT IS ZERO!', {
        inputMarginPercent: data.margin_keuntungan_persen,
        costPerPortion: costBreakdown.costPerPortion,
        totalProductionCost: costBreakdown.totalProductionCost
      });
    }
    
    return result;
  }, [costBreakdown, data.marginKeuntunganPersen, data.jumlahPorsi, data.jumlahPcsPerPorsi]);

  // Calculate break-even point
  const breakEvenPoint = useMemo(() => {
    const result = calculateBreakEvenPoint(costBreakdown.totalProductionCost, profitAnalysis.profitPerPortion);
    logger.debug('Break-even point calculated', { result });
    return result;
  }, [costBreakdown.totalProductionCost, profitAnalysis.profitPerPortion]);

  // Get cost distribution percentages
  const costDistribution = useMemo(() => {
    return getCostDistribution(costBreakdown);
  }, [costBreakdown]);

  // Get dominant cost component
  const dominantCostComponent = useMemo(() => {
    return getDominantCostComponent(costBreakdown);
  }, [costBreakdown]);

  // Validate data - FIXED DEPENDENCY
  const validationErrors = useMemo(() => {
    const result = validateCostData(data);
    logger.debug('Validation completed', { errors: result });
    return result;
  }, [data]); // 🔧 FIXED: Use entire data object as dependency

  // Calculate total potential revenue
  const totalRevenue = useMemo(() => {
    const result = profitAnalysis.sellingPricePerPortion * data.jumlahPorsi;
    logger.debug('Total revenue calculation', {
      sellingPricePerPortion: profitAnalysis.sellingPricePerPortion,
      jumlahPorsi: data.jumlahPorsi,
      totalRevenue: result
    });
    return result;
  }, [profitAnalysis.sellingPricePerPortion, data.jumlahPorsi]);

  // Check if data is valid
  const isDataValid = useMemo(() => {
    const result = Object.keys(validationErrors).length === 0 && costBreakdown.totalProductionCost > 0;
    logger.debug('Data validation check', {
      isValid: result,
      errorCount: Object.keys(validationErrors).length,
      totalProductionCost: costBreakdown.totalProductionCost,
      validationErrors
    });
    return result;
  }, [validationErrors, costBreakdown.totalProductionCost]);

  // 🐛 FINAL DEBUG LOG
  logger.debug('useCostCalculation FINAL RESULT', {
    costBreakdown,
    profitAnalysis,
    marginAmount: profitAnalysis.marginAmount,
    isMarginZero: profitAnalysis.marginAmount === 0,
    totalRevenue,
    isDataValid
  });

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