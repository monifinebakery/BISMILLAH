// src/components/recipe/components/RecipeForm/CostCalculationStep/utils/calculations.ts - FIXED

import { logger } from '@/utils/logger';
import type { CostCalculationData, CostBreakdown, ProfitAnalysis } from './types';
import { safePerformance } from '@/utils/browserApiSafeWrappers';


/**
 * Calculate ingredient cost from recipe materials
 * Compatible with original recipeUtils format
 */
export const calculateIngredientCost = (bahanResep: any[]): number => {
  logger.perf('calculateIngredientCost', 0); // Start performance tracking
  const startTime = safePerformance.now();
  
  if (!bahanResep || bahanResep.length === 0) {
    logger.debug('No ingredients provided for cost calculation');
    return 0;
  }
  
  logger.debug('Calculating ingredient cost', { ingredientCount: bahanResep.length });
  
  const totalCost = bahanResep.reduce((total, bahan, index) => {
    // Handle different possible property names from original code
    const jumlah = Number(bahan.jumlah || bahan.quantity || 0);
    const harga = Number(bahan.hargaPerSatuan || bahan.hargaSatuan || bahan.price || bahan.unitPrice || 0);
    const subtotal = jumlah * harga;
    
    logger.debug('Ingredient calculation', { 
      index,
      nama: bahan.namaBahan || bahan.name, 
      jumlah, 
      harga, 
      subtotal
    });
    
    return total + subtotal;
  }, 0);

  const duration = safePerformance.now() - startTime;
  logger.perf('calculateIngredientCost', duration, { 
    totalCost, 
    ingredientCount: bahanResep.length 
  });
  
  return totalCost;
};

/**
 * Calculate complete cost breakdown
 */
export const calculateCostBreakdown = (data: CostCalculationData): CostBreakdown => {
  const startTime = safePerformance.now();
  logger.debug('Starting cost breakdown calculation', data);
  
  const ingredientCost = calculateIngredientCost(data.bahanResep);
  const laborCost = data.biayaTenagaKerja || 0;
  const overheadCost = data.biayaOverhead || 0;
  const totalProductionCost = ingredientCost + laborCost + overheadCost;
  
  const costPerPortion = data.jumlahPorsi > 0 ? totalProductionCost / data.jumlahPorsi : 0;
  const costPerPiece = data.jumlahPcsPerPorsi > 0 ? costPerPortion / data.jumlahPcsPerPorsi : 0;

  const breakdown: CostBreakdown = {
    ingredientCost,
    laborCost,
    overheadCost,
    totalProductionCost,
    costPerPortion,
    costPerPiece,
  };

  const duration = safePerformance.now() - startTime;
  logger.perf('calculateCostBreakdown', duration, breakdown);
  
  return breakdown;
};

/**
 * Calculate profit analysis - FIXED VERSION
 */
export const calculateProfitAnalysis = (
  costBreakdown: CostBreakdown,
  data: CostCalculationData
): ProfitAnalysis => {
  const startTime = safePerformance.now();
  logger.debug('Starting profit analysis calculation', { 
    costBreakdown, 
    marginPercent: data.marginKeuntunganPersen 
  });
  
  const marginPercent = data.marginKeuntunganPersen || 0;
  
  // ✅ FIXED: Calculate margin per portion, not from total
  const marginPerPortion = costBreakdown.costPerPortion * marginPercent / 100;
  const marginAmount = marginPerPortion * data.jumlahPorsi; // Total margin for all portions
  
  // ✅ FIXED: Simple addition, no division needed
  const sellingPricePerPortion = costBreakdown.costPerPortion + marginPerPortion;
  const sellingPricePerPiece = costBreakdown.costPerPiece + (marginPerPortion / (data.jumlahPcsPerPorsi || 1));
  
  const profitPerPortion = marginPerPortion; // This is the profit
  const profitPerPiece = marginPerPortion / (data.jumlahPcsPerPorsi || 1);
  
  const profitabilityLevel: ProfitAnalysis['profitabilityLevel'] = 
    marginPercent >= 30 ? 'high' : 
    marginPercent >= 15 ? 'medium' : 'low';

  const analysis: ProfitAnalysis = {
    marginAmount,
    sellingPricePerPortion,
    sellingPricePerPiece,
    profitPerPortion,
    profitPerPiece,
    profitabilityLevel,
  };

  const duration = safePerformance.now() - startTime;
  logger.perf('calculateProfitAnalysis', duration, analysis);
  
  // Debug logging to help track the issue
  logger.debug('Profit analysis calculation details:', {
    costPerPortion: costBreakdown.costPerPortion,
    marginPercent,
    marginPerPortion,
    marginAmount,
    sellingPricePerPortion,
    profitPerPortion
  });
  
  if (profitabilityLevel === 'low') {
    logger.warn('Low profitability detected', { 
      marginPercent, 
      profitabilityLevel,
      totalCost: costBreakdown.totalProductionCost 
    });
  }
  
  return analysis;
};

/**
 * Calculate break-even point
 */
export const calculateBreakEvenPoint = (
  totalProductionCost: number,
  profitPerPortion: number
): number => {
  logger.debug('Calculating break-even point', { totalProductionCost, profitPerPortion });
  
  if (profitPerPortion <= 0) {
    logger.warn('Cannot calculate break-even: profit per portion is zero or negative', {
      profitPerPortion
    });
    return 0;
  }
  
  const breakEvenPoint = Math.ceil(totalProductionCost / profitPerPortion);
  
  logger.debug('Break-even point calculated', { 
    breakEvenPoint,
    totalProductionCost,
    profitPerPortion 
  });
  
  return breakEvenPoint;
};

/**
 * Get cost distribution percentages
 */
export const getCostDistribution = (costBreakdown: CostBreakdown) => {
  const { ingredientCost, laborCost, overheadCost, totalProductionCost } = costBreakdown;
  
  if (totalProductionCost === 0) {
    logger.warn('Total production cost is zero, returning zero distribution');
    return { ingredientPercent: 0, laborPercent: 0, overheadPercent: 0 };
  }

  const distribution = {
    ingredientPercent: Math.round((ingredientCost / totalProductionCost) * 100),
    laborPercent: Math.round((laborCost / totalProductionCost) * 100),
    overheadPercent: Math.round((overheadCost / totalProductionCost) * 100),
  };

  logger.debug('Cost distribution calculated', { costBreakdown, distribution });
  
  return distribution;
};

/**
 * Get dominant cost component
 */
export const getDominantCostComponent = (costBreakdown: CostBreakdown): string => {
  const { ingredientCost, laborCost, overheadCost } = costBreakdown;
  
  let dominantComponent: string;
  
  if (ingredientCost >= laborCost && ingredientCost >= overheadCost) {
    dominantComponent = 'Bahan Baku';
  } else if (laborCost >= overheadCost) {
    dominantComponent = 'Tenaga Kerja';
  } else {
    dominantComponent = 'Overhead';
  }

  logger.debug('Dominant cost component identified', { 
    dominantComponent,
    costs: { ingredientCost, laborCost, overheadCost }
  });
  
  return dominantComponent;
};

/**
 * Validate cost calculation data
 */
export const validateCostData = (data: CostCalculationData) => {
  logger.debug('Validating cost calculation data', data);
  
  const errors: Record<string, string> = {};

  if (data.biayaTenagaKerja !== undefined && data.biayaTenagaKerja < 0) {
    errors.biayaTenagaKerja = 'Biaya tenaga kerja tidak boleh negatif';
    logger.warn('Validation error: negative labor cost', { biayaTenagaKerja: data.biayaTenagaKerja });
  }

  if (data.biayaOverhead !== undefined && data.biayaOverhead < 0) {
    errors.biayaOverhead = 'Biaya overhead tidak boleh negatif';
    logger.warn('Validation error: negative overhead cost', { biayaOverhead: data.biayaOverhead });
  }

  if (data.marginKeuntunganPersen !== undefined) {
    if (data.marginKeuntunganPersen < 0) {
      errors.marginKeuntunganPersen = 'Margin keuntungan tidak boleh negatif';
      logger.warn('Validation error: negative profit margin', { marginKeuntunganPersen: data.marginKeuntunganPersen });
    } else if (data.marginKeuntunganPersen > 1000) {
      errors.marginKeuntunganPersen = 'Margin keuntungan tidak boleh lebih dari 1000%';
      logger.warn('Validation error: excessive profit margin', { marginKeuntunganPersen: data.marginKeuntunganPersen });
    }
  }

  if (Object.keys(errors).length > 0) {
    logger.error('Cost data validation failed', { errors, data });
  } else {
    logger.debug('Cost data validation passed');
  }

  return errors;
};

/**
 * Debug helper function to test calculations
 */
export const debugCalculations = (data: CostCalculationData) => {
  console.log('=== DEBUG CALCULATIONS ===');
  console.log('Input data:', data);
  
  const costBreakdown = calculateCostBreakdown(data);
  console.log('Cost breakdown:', costBreakdown);
  
  const profitAnalysis = calculateProfitAnalysis(costBreakdown, data);
  console.log('Profit analysis:', profitAnalysis);
  
  // Manual verification
  const expectedMarginPerPortion = costBreakdown.costPerPortion * (data.marginKeuntunganPersen || 0) / 100;
  console.log('Expected margin per portion:', expectedMarginPerPortion);
  console.log('Actual margin amount:', profitAnalysis.marginAmount);
  
  return { costBreakdown, profitAnalysis };
};