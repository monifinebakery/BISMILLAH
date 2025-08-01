// src/components/recipe/components/RecipeForm/CostCalculationStep/utils/calculations.ts

import type { CostCalculationData, CostBreakdown, ProfitAnalysis } from './types';

/**
 * Calculate ingredient cost from recipe materials
 * Compatible with original recipeUtils format
 */
export const calculateIngredientCost = (bahanResep: any[]): number => {
  if (!bahanResep || bahanResep.length === 0) return 0;
  
  return bahanResep.reduce((total, bahan) => {
    // Handle different possible property names from original code
    const jumlah = Number(bahan.jumlah || bahan.quantity || 0);
    const harga = Number(bahan.hargaPerSatuan || bahan.hargaSatuan || bahan.price || bahan.unitPrice || 0);
    
    console.log('Ingredient calculation:', { 
      nama: bahan.namaBahan || bahan.name, 
      jumlah, 
      harga, 
      subtotal: jumlah * harga 
    }); // Debug log
    
    return total + (jumlah * harga);
  }, 0);
};

/**
 * Calculate complete cost breakdown
 */
export const calculateCostBreakdown = (data: CostCalculationData): CostBreakdown => {
  const ingredientCost = calculateIngredientCost(data.bahanResep);
  const laborCost = data.biayaTenagaKerja || 0;
  const overheadCost = data.biayaOverhead || 0;
  const totalProductionCost = ingredientCost + laborCost + overheadCost;
  
  const costPerPortion = data.jumlahPorsi > 0 ? totalProductionCost / data.jumlahPorsi : 0;
  const costPerPiece = data.jumlahPcsPerPorsi > 0 ? costPerPortion / data.jumlahPcsPerPorsi : 0;

  return {
    ingredientCost,
    laborCost,
    overheadCost,
    totalProductionCost,
    costPerPortion,
    costPerPiece,
  };
};

/**
 * Calculate profit analysis
 */
export const calculateProfitAnalysis = (
  costBreakdown: CostBreakdown,
  data: CostCalculationData
): ProfitAnalysis => {
  const marginPercent = data.marginKeuntunganPersen || 0;
  const marginAmount = costBreakdown.totalProductionCost * marginPercent / 100;
  
  const sellingPricePerPortion = costBreakdown.costPerPortion + (marginAmount / data.jumlahPorsi);
  const sellingPricePerPiece = costBreakdown.costPerPiece + (marginAmount / data.jumlahPorsi / (data.jumlahPcsPerPorsi || 1));
  
  const profitPerPortion = sellingPricePerPortion - costBreakdown.costPerPortion;
  const profitPerPiece = sellingPricePerPiece - costBreakdown.costPerPiece;
  
  const profitabilityLevel: ProfitAnalysis['profitabilityLevel'] = 
    marginPercent >= 30 ? 'high' : 
    marginPercent >= 15 ? 'medium' : 'low';

  return {
    marginAmount,
    sellingPricePerPortion,
    sellingPricePerPiece,
    profitPerPortion,
    profitPerPiece,
    profitabilityLevel,
  };
};

/**
 * Calculate break-even point
 */
export const calculateBreakEvenPoint = (
  totalProductionCost: number,
  profitPerPortion: number
): number => {
  if (profitPerPortion <= 0) return 0;
  return Math.ceil(totalProductionCost / profitPerPortion);
};

/**
 * Get cost distribution percentages
 */
export const getCostDistribution = (costBreakdown: CostBreakdown) => {
  const { ingredientCost, laborCost, overheadCost, totalProductionCost } = costBreakdown;
  
  if (totalProductionCost === 0) {
    return { ingredientPercent: 0, laborPercent: 0, overheadPercent: 0 };
  }

  return {
    ingredientPercent: Math.round((ingredientCost / totalProductionCost) * 100),
    laborPercent: Math.round((laborCost / totalProductionCost) * 100),
    overheadPercent: Math.round((overheadCost / totalProductionCost) * 100),
  };
};

/**
 * Get dominant cost component
 */
export const getDominantCostComponent = (costBreakdown: CostBreakdown): string => {
  const { ingredientCost, laborCost, overheadCost } = costBreakdown;
  
  if (ingredientCost >= laborCost && ingredientCost >= overheadCost) {
    return 'Bahan Baku';
  } else if (laborCost >= overheadCost) {
    return 'Tenaga Kerja';
  } else {
    return 'Overhead';
  }
};

/**
 * Validate cost calculation data
 */
export const validateCostData = (data: CostCalculationData) => {
  const errors: Record<string, string> = {};

  if (data.biayaTenagaKerja !== undefined && data.biayaTenagaKerja < 0) {
    errors.biayaTenagaKerja = 'Biaya tenaga kerja tidak boleh negatif';
  }

  if (data.biayaOverhead !== undefined && data.biayaOverhead < 0) {
    errors.biayaOverhead = 'Biaya overhead tidak boleh negatif';
  }

  if (data.marginKeuntunganPersen !== undefined) {
    if (data.marginKeuntunganPersen < 0) {
      errors.marginKeuntunganPersen = 'Margin keuntungan tidak boleh negatif';
    } else if (data.marginKeuntunganPersen > 1000) {
      errors.marginKeuntunganPersen = 'Margin keuntungan tidak boleh lebih dari 1000%';
    }
  }

  return errors;
};