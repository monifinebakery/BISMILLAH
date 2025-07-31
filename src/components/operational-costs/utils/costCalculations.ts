// src/components/operational-costs/utils/costCalculations.ts

import { OperationalCost, AllocationSettings } from '../types';

/**
 * Calculate total active costs
 */
export const calculateTotalActiveCosts = (costs: OperationalCost[]): number => {
  return costs
    .filter(cost => cost.status === 'aktif')
    .reduce((total, cost) => total + Number(cost.jumlah_per_bulan), 0);
};

/**
 * Calculate overhead per unit based on allocation method
 */
export const calculateOverheadPerUnit = (
  totalCosts: number,
  settings: AllocationSettings,
  materialCost: number = 0
): number => {
  if (settings.metode === 'per_unit') {
    // Overhead per unit = Total biaya / Estimasi produksi
    return settings.nilai > 0 ? totalCosts / settings.nilai : 0;
  } else if (settings.metode === 'persentase') {
    // Overhead = % dari material cost
    return materialCost * (settings.nilai / 100);
  }
  return 0;
};

/**
 * Calculate total overhead for given material cost
 */
export const calculateTotalOverhead = (
  overheadPerUnit: number,
  quantity: number = 1
): number => {
  return overheadPerUnit * quantity;
};

/**
 * Calculate cost breakdown by type
 */
export const calculateCostBreakdown = (costs: OperationalCost[]) => {
  const activeCosts = costs.filter(cost => cost.status === 'aktif');
  
  const tetap = activeCosts
    .filter(cost => cost.jenis === 'tetap')
    .reduce((total, cost) => total + Number(cost.jumlah_per_bulan), 0);
    
  const variabel = activeCosts
    .filter(cost => cost.jenis === 'variabel')
    .reduce((total, cost) => total + Number(cost.jumlah_per_bulan), 0);

  return {
    tetap,
    variabel,
    total: tetap + variabel,
    percentageTetap: tetap > 0 ? (tetap / (tetap + variabel)) * 100 : 0,
    percentageVariabel: variabel > 0 ? (variabel / (tetap + variabel)) * 100 : 0,
  };
};

/**
 * Calculate HPP (Harga Pokok Produksi)
 */
export const calculateHPP = (
  materialCost: number,
  laborCost: number,
  overheadPerUnit: number
): number => {
  return materialCost + laborCost + overheadPerUnit;
};

/**
 * Calculate production cost efficiency
 */
export const calculateEfficiency = (
  actualCost: number,
  standardCost: number
): {
  variance: number;
  variancePercentage: number;
  isEfficient: boolean;
} => {
  const variance = actualCost - standardCost;
  const variancePercentage = standardCost > 0 ? (variance / standardCost) * 100 : 0;
  
  return {
    variance,
    variancePercentage,
    isEfficient: variance <= 0,
  };
};

/**
 * Project monthly costs based on current settings
 */
export const projectMonthlyCosts = (
  costs: OperationalCost[],
  growthRate: number = 0
): {
  currentMonth: number;
  nextMonth: number;
  projected: number[];
} => {
  const currentMonth = calculateTotalActiveCosts(costs);
  const nextMonth = currentMonth * (1 + growthRate / 100);
  
  // Project next 6 months
  const projected = Array.from({ length: 6 }, (_, index) => {
    return currentMonth * Math.pow(1 + growthRate / 100, index + 1);
  });

  return {
    currentMonth,
    nextMonth,
    projected,
  };
};

/**
 * Calculate break-even analysis
 */
export const calculateBreakEven = (
  fixedCosts: number,
  variableCostPerUnit: number,
  sellingPricePerUnit: number
): {
  breakEvenUnits: number;
  breakEvenRevenue: number;
  contributionMargin: number;
  contributionMarginRatio: number;
} => {
  const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
  const contributionMarginRatio = contributionMargin / sellingPricePerUnit;
  const breakEvenUnits = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;
  const breakEvenRevenue = breakEvenUnits * sellingPricePerUnit;

  return {
    breakEvenUnits,
    breakEvenRevenue,
    contributionMargin,
    contributionMarginRatio,
  };
};

/**
 * Validate allocation method calculations
 */
export const validateAllocationCalculation = (
  method: 'per_unit' | 'persentase',
  value: number,
  materialCost?: number
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (value <= 0) {
    errors.push('Nilai harus lebih besar dari 0');
  }

  if (method === 'per_unit') {
    if (value > 1000000) {
      warnings.push('Estimasi produksi sangat tinggi, pastikan nilai sudah benar');
    }
    if (value < 10) {
      warnings.push('Estimasi produksi sangat rendah, pastikan nilai sudah benar');
    }
  } else if (method === 'persentase') {
    if (value > 1000) {
      errors.push('Persentase tidak boleh lebih dari 1000%');
    }
    if (value > 100) {
      warnings.push('Persentase overhead di atas 100% cukup tinggi');
    }
    if (!materialCost && value > 0) {
      warnings.push('Metode persentase memerlukan biaya material untuk perhitungan yang akurat');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};