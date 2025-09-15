// src/components/recipe/components/RecipeForm/CostCalculationStep/utils/calculations.ts - FIXED

import { logger } from '@/utils/logger';
import type { CostCalculationData, CostBreakdown, ProfitAnalysis } from './types';
import { safePerformance } from '@/utils/browserApiSafeWrappers';


/**
 * Calculate ingredient cost from recipe materials
 * Compatible with original recipeUtils format
 */
export const calculateIngredientCost = (bahan_resep: any[]): number => {
  logger.perf('calculateIngredientCost', 0); // Start performance tracking
  const startTime = safePerformance.now();
  \n  if (!bahan_resep || bahan_resep.length === 0) {\n    logger.debug('No ingredients provided for cost calculation');\n    return 0;\n  }\n  \n  logger.debug('Calculating ingredient cost', { ingredientCount: bahan_resep.length });\n  \n  const totalCost = bahan_resep.reduce((total, bahan, index) => {\n    // Handle different possible property names from original code\n    const jumlah = Number(bahan.jumlah || bahan.quantity || 0);\n    const harga = Number(bahan.hargaPerSatuan || bahan.hargaSatuan || bahan.price || bahan.unitPrice || 0);\n    const subtotal = jumlah * harga;\n    \n    logger.debug('Ingredient calculation', { \n      index,\n      nama: bahan.namaBahan || bahan.name, \n      jumlah, \n      harga, \n      subtotal\n    });\n    \n    return total + subtotal;\n  }, 0);\n\n  const duration = safePerformance.now() - startTime;\n  logger.perf('calculateIngredientCost', duration, { \n    totalCost, \n    ingredientCount: bahan_resep.length \n  });\n  \n  return totalCost;\n};\n

/**
 * Calculate complete cost breakdown
 */
export const calculateCostBreakdown = (data: CostCalculationData): CostBreakdown => {
  const startTime = safePerformance.now();
  logger.debug('Starting cost breakdown calculation', data);
  
  const ingredientCost = calculateIngredientCost(data.bahan_resep);
  const laborCost = data.biaya_tenaga_kerja || 0;
  const overheadCost = data.biaya_overhead || 0;
  const totalProductionCost = ingredientCost + laborCost + overheadCost;
  
  const costPerPortion = data.jumlah_porsi > 0 ? totalProductionCost / data.jumlah_porsi : 0;
  const costPerPiece = data.jumlah_pcs_per_porsi > 0 ? costPerPortion / data.jumlah_pcs_per_porsi : 0;

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
  logger.debug('Starting profit analysis calculation', { \n    costBreakdown, \n    marginPercent: data.margin_keuntungan_persen \n  });\n  \n  const marginPercent = data.margin_keuntungan_persen || 0;\n  \n  // ✅ FIXED: Calculate margin per portion, not from total\n  const marginPerPortion = costBreakdown.costPerPortion * marginPercent / 100;\n  const marginAmount = marginPerPortion * data.jumlah_porsi; // Total margin for all portions\n  \n  // ✅ FIXED: Simple addition, no division needed\n  const sellingPricePerPortion = costBreakdown.costPerPortion + marginPerPortion;\n  const sellingPricePerPiece = costBreakdown.costPerPiece + (marginPerPortion / (data.jumlah_pcs_per_porsi || 1));\n  \n  const profitPerPortion = marginPerPortion; // This is the profit\n  const profitPerPiece = marginPerPortion / (data.jumlah_pcs_per_porsi || 1);\n  \n  const profitabilityLevel: ProfitAnalysis['profitabilityLevel'] = \n    marginPercent >= 30 ? 'high' : \n    marginPercent >= 15 ? 'medium' : 'low';\n\n  const analysis: ProfitAnalysis = {\n    marginAmount,\n    sellingPricePerPortion,\n    sellingPricePerPiece,\n    profitPerPortion,\n    profitPerPiece,\n    profitabilityLevel,\n  };\n\n  const duration = safePerformance.now() - startTime;\n  logger.perf('calculateProfitAnalysis', duration, analysis);\n  \n  // Debug logging to help track the issue\n  logger.debug('Profit analysis calculation details:', {\n    costPerPortion: costBreakdown.costPerPortion,\n    marginPercent,\n    marginPerPortion,\n    marginAmount,\n    sellingPricePerPortion,\n    profitPerPortion\n  });\n  \n  if (profitabilityLevel === 'low') {\n    logger.warn('Low profitability detected', { \n      marginPercent, \n      profitabilityLevel,\n      totalCost: costBreakdown.totalProductionCost \n    });\n  }\n  \n  return analysis;\n};

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

  if (data.biaya_tenaga_kerja !== undefined && data.biaya_tenaga_kerja < 0) {
    errors.biaya_tenaga_kerja = 'Biaya tenaga kerja tidak boleh negatif';
    logger.warn('Validation error: negative labor cost', { biaya_tenaga_kerja: data.biaya_tenaga_kerja });\n  }\n

  if (data.biaya_overhead !== undefined && data.biaya_overhead < 0) {
    errors.biaya_overhead = 'Biaya overhead tidak boleh negatif';
    logger.warn('Validation error: negative overhead cost', { biaya_overhead: data.biaya_overhead });\n  }\n

  if (data.margin_keuntungan_persen !== undefined) {
    if (data.margin_keuntungan_persen < 0) {
      errors.margin_keuntungan_persen = 'Margin keuntungan tidak boleh negatif';
      logger.warn('Validation error: negative profit margin', { margin_keuntungan_persen: data.margin_keuntungan_persen });\n    } else if (data.margin_keuntungan_persen > 1000) {\n      errors.margin_keuntungan_persen = 'Margin keuntungan tidak boleh lebih dari 1000%';\n      logger.warn('Validation error: excessive profit margin', { margin_keuntungan_persen: data.margin_keuntungan_persen });\n    }\n  }\n

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
  // Calculate cost breakdown and profit analysis
  const costBreakdown = calculateCostBreakdown(data);
  const profitAnalysis = calculateProfitAnalysis(costBreakdown, data);
  
  // Manual verification
  const expectedMarginPerPortion = costBreakdown.costPerPortion * (data.marginKeuntunganPersen || 0) / 100;
  
  return { costBreakdown, profitAnalysis };
};