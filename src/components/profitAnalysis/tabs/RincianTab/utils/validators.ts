// src/components/profitAnalysis/tabs/rincianTab/utils/validators.ts

import { ProfitAnalysisResult } from '../../types';

/**
 * Validate profit analysis data structure
 */
export const validateProfitData = (data: any): data is ProfitAnalysisResult => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check required top-level properties
  const requiredKeys = ['profitMarginData', 'cogsBreakdown', 'opexBreakdown'];
  if (!requiredKeys.every(key => key in data)) {
    return false;
  }

  // Validate profitMarginData
  const profitMarginData = data.profitMarginData;
  if (!profitMarginData || typeof profitMarginData !== 'object') {
    return false;
  }

  const requiredProfitKeys = ['revenue', 'cogs', 'opex', 'netProfit', 'grossMargin', 'netMargin'];
  if (!requiredProfitKeys.every(key => typeof profitMarginData[key] === 'number')) {
    return false;
  }

  // Validate cogsBreakdown
  const cogsBreakdown = data.cogsBreakdown;
  if (!cogsBreakdown || typeof cogsBreakdown !== 'object') {
    return false;
  }

  const requiredCogsKeys = ['totalMaterialCost', 'totalDirectLaborCost', 'manufacturingOverhead', 'totalCOGS'];
  if (!requiredCogsKeys.every(key => typeof cogsBreakdown[key] === 'number')) {
    return false;
  }

  // Validate opexBreakdown
  const opexBreakdown = data.opexBreakdown;
  if (!opexBreakdown || typeof opexBreakdown !== 'object') {
    return false;
  }

  const requiredOpexKeys = ['totalAdministrative', 'totalSelling', 'totalGeneral', 'totalOPEX'];
  if (!requiredOpexKeys.every(key => typeof opexBreakdown[key] === 'number')) {
    return false;
  }

  return true;
};

/**
 * Check if data has actual material usage records
 */
export const hasActualMaterialUsage = (data: ProfitAnalysisResult): boolean => {
  return !!(
    data.cogsBreakdown.actualMaterialUsage && 
    Array.isArray(data.cogsBreakdown.actualMaterialUsage) &&
    data.cogsBreakdown.actualMaterialUsage.length > 0
  );
};

/**
 * Check if data has detailed material costs
 */
export const hasDetailedMaterialCosts = (data: ProfitAnalysisResult): boolean => {
  return !!(
    data.cogsBreakdown.materialCosts && 
    Array.isArray(data.cogsBreakdown.materialCosts) &&
    data.cogsBreakdown.materialCosts.length > 0
  );
};

/**
 * Check if data has detailed labor costs
 */
export const hasDetailedLaborCosts = (data: ProfitAnalysisResult): boolean => {
  return !!(
    data.cogsBreakdown.directLaborCosts && 
    Array.isArray(data.cogsBreakdown.directLaborCosts) &&
    data.cogsBreakdown.directLaborCosts.length > 0
  );
};

/**
 * Check if data has detailed OPEX breakdown
 */
export const hasDetailedOpexBreakdown = (data: ProfitAnalysisResult): boolean => {
  const { opexBreakdown } = data;
  return !!(
    (opexBreakdown.administrativeExpenses && opexBreakdown.administrativeExpenses.length > 0) ||
    (opexBreakdown.sellingExpenses && opexBreakdown.sellingExpenses.length > 0) ||
    (opexBreakdown.generalExpenses && opexBreakdown.generalExpenses.length > 0)
  );
};

/**
 * Validate numeric values are positive
 */
export const validatePositiveNumbers = (values: Record<string, number>): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  Object.entries(values).forEach(([key, value]) => {
    const fieldErrors: string[] = [];
    
    if (typeof value !== 'number' || isNaN(value)) {
      fieldErrors.push('Harus berupa angka yang valid');
    } else if (value < 0) {
      fieldErrors.push('Tidak boleh bernilai negatif');
    }
    
    if (fieldErrors.length > 0) {
      errors[key] = fieldErrors;
    }
  });

  return errors;
};

/**
 * Validate percentage values (0-100)
 */
export const validatePercentages = (values: Record<string, number>): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  Object.entries(values).forEach(([key, value]) => {
    const fieldErrors: string[] = [];
    
    if (typeof value !== 'number' || isNaN(value)) {
      fieldErrors.push('Harus berupa angka yang valid');
    } else if (value < 0 || value > 100) {
      fieldErrors.push('Harus berada dalam rentang 0-100%');
    }
    
    if (fieldErrors.length > 0) {
      errors[key] = fieldErrors;
    }
  });

  return errors;
};

/**
 * Check data consistency
 */
export const validateDataConsistency = (data: ProfitAnalysisResult): string[] => {
  const warnings: string[] = [];
  const { profitMarginData, cogsBreakdown, opexBreakdown } = data;

  // Check if COGS breakdown sums correctly
  const cogsSum = cogsBreakdown.totalMaterialCost + 
                  cogsBreakdown.totalDirectLaborCost + 
                  cogsBreakdown.manufacturingOverhead;
  
  if (Math.abs(cogsSum - cogsBreakdown.totalCOGS) > 1) {
    warnings.push('Inkonsistensi dalam perhitungan total COGS');
  }

  // Check if OPEX breakdown sums correctly
  const opexSum = opexBreakdown.totalAdministrative + 
                  opexBreakdown.totalSelling + 
                  opexBreakdown.totalGeneral;
  
  if (Math.abs(opexSum - opexBreakdown.totalOPEX) > 1) {
    warnings.push('Inkonsistensi dalam perhitungan total OPEX');
  }

  // Check if profit calculation is correct
  const calculatedProfit = profitMarginData.revenue - profitMarginData.cogs - profitMarginData.opex;
  if (Math.abs(calculatedProfit - profitMarginData.netProfit) > 1) {
    warnings.push('Inkonsistensi dalam perhitungan net profit');
  }

  // Check if margins are realistic
  if (profitMarginData.grossMargin > 95) {
    warnings.push('Gross margin sangat tinggi, periksa kembali perhitungan COGS');
  }

  if (profitMarginData.netMargin < -50) {
    warnings.push('Net margin sangat rendah, periksa struktur biaya');
  }

  // Check for unusually high cost ratios
  const revenue = profitMarginData.revenue;
  if (revenue > 0) {
    const materialRatio = (cogsBreakdown.totalMaterialCost / revenue) * 100;
    const laborRatio = (cogsBreakdown.totalDirectLaborCost / revenue) * 100;
    
    if (materialRatio > 80) {
      warnings.push('Rasio biaya material sangat tinggi (>80% dari revenue)');
    }
    
    if (laborRatio > 50) {
      warnings.push('Rasio biaya tenaga kerja sangat tinggi (>50% dari revenue)');
    }
  }

  return warnings;
};

/**
 * Get data quality score (0-100)
 */
export const calculateDataQualityScore = (data: ProfitAnalysisResult): {
  score: number;
  factors: Array<{ name: string; score: number; weight: number }>;
} => {
  const factors = [
    {
      name: 'Kelengkapan Data',
      score: validateProfitData(data) ? 100 : 0,
      weight: 0.3
    },
    {
      name: 'Detail Material Usage', 
      score: hasActualMaterialUsage(data) ? 100 : hasDetailedMaterialCosts(data) ? 70 : 40,
      weight: 0.25
    },
    {
      name: 'Detail Labor Costs',
      score: hasDetailedLaborCosts(data) ? 100 : 50,
      weight: 0.15
    },
    {
      name: 'Detail OPEX Breakdown',
      score: hasDetailedOpexBreakdown(data) ? 100 : 50,
      weight: 0.15
    },
    {
      name: 'Konsistensi Data',
      score: validateDataConsistency(data).length === 0 ? 100 : 70,
      weight: 0.15
    }
  ];

  const totalScore = factors.reduce((sum, factor) => {
    return sum + (factor.score * factor.weight);
  }, 0);

  return {
    score: Math.round(totalScore),
    factors
  };
};