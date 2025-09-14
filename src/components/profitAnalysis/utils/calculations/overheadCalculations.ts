// src/components/profitAnalysis/utils/calculations/overheadCalculations.ts
// Utility untuk perhitungan overhead yang konsisten

import { logger } from '@/utils/logger';
import { BahanBakuActual, OperationalCostActual } from '../../types/profitAnalysis.types';
import { BusinessType, getValidationThresholds } from '../config/profitConfig';

/**
 * Interface untuk hasil perhitungan overhead
 */
export interface OverheadCalculationResult {
  totalOverhead: number;
  overheadPerUnit: number;
  overheadPerPortion: number;
  breakdown: OverheadBreakdown;
  efficiency: OverheadEfficiency;
}

/**
 * Interface untuk breakdown overhead
 */
export interface OverheadBreakdown {
  fixedCosts: {
    rent: number;
    utilities: number;
    insurance: number;
    depreciation: number;
    other: number;
    total: number;
  };
  variableCosts: {
    labor: number;
    maintenance: number;
    marketing: number;
    other: number;
    total: number;
  };
  totalOverhead: number;
}

/**
 * Interface untuk efisiensi overhead
 */
export interface OverheadEfficiency {
  overheadRatio: number;        // Overhead sebagai % dari revenue
  fixedCostRatio: number;       // Fixed cost sebagai % dari revenue
  variableCostRatio: number;    // Variable cost sebagai % dari revenue
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

/**
 * Enum untuk kategori overhead
 */
export enum OverheadCategory {
  // Fixed Costs
  RENT = 'rent',
  UTILITIES = 'utilities',
  INSURANCE = 'insurance',
  DEPRECIATION = 'depreciation',
  
  // Variable Costs
  LABOR = 'labor',
  MAINTENANCE = 'maintenance',
  MARKETING = 'marketing',
  
  // Other
  OTHER_FIXED = 'other_fixed',
  OTHER_VARIABLE = 'other_variable'
}

/**
 * Mapping kategori operational cost ke overhead category
 */
const OVERHEAD_CATEGORY_MAPPING: Record<string, OverheadCategory> = {
  'sewa': OverheadCategory.RENT,
  'rent': OverheadCategory.RENT,
  'listrik': OverheadCategory.UTILITIES,
  'air': OverheadCategory.UTILITIES,
  'utilities': OverheadCategory.UTILITIES,
  'asuransi': OverheadCategory.INSURANCE,
  'insurance': OverheadCategory.INSURANCE,
  'penyusutan': OverheadCategory.DEPRECIATION,
  'depreciation': OverheadCategory.DEPRECIATION,
  'gaji': OverheadCategory.LABOR,
  'salary': OverheadCategory.LABOR,
  'upah': OverheadCategory.LABOR,
  'wage': OverheadCategory.LABOR,
  'maintenance': OverheadCategory.MAINTENANCE,
  'perawatan': OverheadCategory.MAINTENANCE,
  'marketing': OverheadCategory.MARKETING,
  'promosi': OverheadCategory.MARKETING,
  'iklan': OverheadCategory.MARKETING
};

/**
 * Utility untuk mengkategorikan operational cost
 */
function categorizeOperationalCost(cost: OperationalCostActual): OverheadCategory {
  const name = cost.nama_biaya?.toLowerCase() || '';
  const description = cost.deskripsi?.toLowerCase() || '';
  const searchText = `${name} ${description}`;

  // Cari kategori berdasarkan keyword
  for (const [keyword, category] of Object.entries(OVERHEAD_CATEGORY_MAPPING)) {
    if (searchText.includes(keyword)) {
      return category;
    }
  }

  // Default ke other berdasarkan jenis
  if (cost.jenis === 'tetap') {
    return OverheadCategory.OTHER_FIXED;
  }
  return OverheadCategory.OTHER_VARIABLE;
}

/**
 * Menghitung overhead dengan breakdown yang detail
 */
export function calculateDetailedOverhead(
  operationalCosts: OperationalCostActual[],
  revenue: number = 0,
  productionVolume: number = 1,
  businessType: BusinessType = BusinessType.DEFAULT
): OverheadCalculationResult {
  logger.debug('Calculating detailed overhead', {
    costsCount: operationalCosts.length,
    revenue,
    productionVolume,
    businessType
  });

  // Filter active costs
  const activeCosts = operationalCosts.filter(cost => cost.status === 'aktif');

  // Initialize breakdown
  const breakdown: OverheadBreakdown = {
    fixedCosts: {
      rent: 0,
      utilities: 0,
      insurance: 0,
      depreciation: 0,
      other: 0,
      total: 0
    },
    variableCosts: {
      labor: 0,
      maintenance: 0,
      marketing: 0,
      other: 0,
      total: 0
    },
    totalOverhead: 0
  };

  // Kategorikan dan hitung setiap cost
  activeCosts.forEach(cost => {
    const amount = Number(cost.monthly_amount) || 0;
    const category = categorizeOperationalCost(cost);

    switch (category) {
      case OverheadCategory.RENT:
        breakdown.fixedCosts.rent += amount;
        break;
      case OverheadCategory.UTILITIES:
        breakdown.fixedCosts.utilities += amount;
        break;
      case OverheadCategory.INSURANCE:
        breakdown.fixedCosts.insurance += amount;
        break;
      case OverheadCategory.DEPRECIATION:
        breakdown.fixedCosts.depreciation += amount;
        break;
      case OverheadCategory.LABOR:
        breakdown.variableCosts.labor += amount;
        break;
      case OverheadCategory.MAINTENANCE:
        breakdown.variableCosts.maintenance += amount;
        break;
      case OverheadCategory.MARKETING:
        breakdown.variableCosts.marketing += amount;
        break;
      case OverheadCategory.OTHER_FIXED:
        breakdown.fixedCosts.other += amount;
        break;
      case OverheadCategory.OTHER_VARIABLE:
        breakdown.variableCosts.other += amount;
        break;
    }
  });

  // Hitung total
  breakdown.fixedCosts.total = 
    breakdown.fixedCosts.rent +
    breakdown.fixedCosts.utilities +
    breakdown.fixedCosts.insurance +
    breakdown.fixedCosts.depreciation +
    breakdown.fixedCosts.other;

  breakdown.variableCosts.total = 
    breakdown.variableCosts.labor +
    breakdown.variableCosts.maintenance +
    breakdown.variableCosts.marketing +
    breakdown.variableCosts.other;

  breakdown.totalOverhead = breakdown.fixedCosts.total + breakdown.variableCosts.total;

  // Hitung per unit dan per porsi
  const overheadPerUnit = productionVolume > 0 ? breakdown.totalOverhead / productionVolume : 0;
  const overheadPerPortion = overheadPerUnit; // Asumsi 1 unit = 1 porsi, bisa disesuaikan

  // Hitung efisiensi
  const efficiency = calculateOverheadEfficiency(
    breakdown,
    revenue,
    businessType
  );

  const result: OverheadCalculationResult = {
    totalOverhead: breakdown.totalOverhead,
    overheadPerUnit,
    overheadPerPortion,
    breakdown,
    efficiency
  };

  logger.debug('Overhead calculation completed', result);
  return result;
}

/**
 * Menghitung efisiensi overhead
 */
function calculateOverheadEfficiency(
  breakdown: OverheadBreakdown,
  revenue: number,
  businessType: BusinessType
): OverheadEfficiency {
  const thresholds = getValidationThresholds(businessType);
  
  const overheadRatio = revenue > 0 ? (breakdown.totalOverhead / revenue) * 100 : 0;
  const fixedCostRatio = revenue > 0 ? (breakdown.fixedCosts.total / revenue) * 100 : 0;
  const variableCostRatio = revenue > 0 ? (breakdown.variableCosts.total / revenue) * 100 : 0;

  // Tentukan efisiensi berdasarkan threshold
  let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  const recommendations: string[] = [];

  if (overheadRatio <= thresholds.alertOpexRatio * 50) { // 50% dari alert threshold
    efficiency = 'excellent';
    recommendations.push('Overhead sangat efisien, pertahankan kinerja ini');
  } else if (overheadRatio <= thresholds.alertOpexRatio * 75) { // 75% dari alert threshold
    efficiency = 'good';
    recommendations.push('Overhead dalam kondisi baik, monitor terus');
  } else if (overheadRatio <= thresholds.alertOpexRatio * 100) { // Alert threshold
    efficiency = 'fair';
    recommendations.push('Overhead mendekati batas, pertimbangkan optimasi');
  } else {
    efficiency = 'poor';
    recommendations.push('Overhead terlalu tinggi, perlu optimasi segera');
  }

  // Rekomendasi spesifik
  if (fixedCostRatio > 40) {
    recommendations.push('Fixed cost tinggi, pertimbangkan negosiasi sewa atau efisiensi operasional');
  }
  
  if (variableCostRatio > 30) {
    recommendations.push('Variable cost tinggi, review efisiensi tenaga kerja dan maintenance');
  }

  if (breakdown.variableCosts.labor > breakdown.fixedCosts.total) {
    recommendations.push('Biaya tenaga kerja dominan, pertimbangkan otomasi atau training efisiensi');
  }

  return {
    overheadRatio,
    fixedCostRatio,
    variableCostRatio,
    efficiency,
    recommendations
  };
}

/**
 * Utility untuk menghitung overhead per pcs (legacy compatibility)
 */
export function calculateOverheadPerPcs(
  operationalCosts: OperationalCostActual[],
  productionVolume: number = 1
): number {
  const result = calculateDetailedOverhead(operationalCosts, 0, productionVolume);
  return result.overheadPerUnit;
}

/**
 * Utility untuk menghitung total overhead (legacy compatibility)
 */
export function calculateTotalOverhead(
  operationalCosts: OperationalCostActual[]
): number {
  const result = calculateDetailedOverhead(operationalCosts);
  return result.totalOverhead;
}

/**
 * Utility untuk format overhead breakdown untuk display
 */
export function formatOverheadBreakdown(breakdown: OverheadBreakdown): string {
  const lines = [
    '=== BREAKDOWN OVERHEAD ===',
    '',
    'FIXED COSTS:',
    `  Sewa/Rent: Rp ${breakdown.fixedCosts.rent.toLocaleString()}`,
    `  Utilities: Rp ${breakdown.fixedCosts.utilities.toLocaleString()}`,
    `  Asuransi: Rp ${breakdown.fixedCosts.insurance.toLocaleString()}`,
    `  Penyusutan: Rp ${breakdown.fixedCosts.depreciation.toLocaleString()}`,
    `  Lainnya: Rp ${breakdown.fixedCosts.other.toLocaleString()}`,
    `  Total Fixed: Rp ${breakdown.fixedCosts.total.toLocaleString()}`,
    '',
    'VARIABLE COSTS:',
    `  Tenaga Kerja: Rp ${breakdown.variableCosts.labor.toLocaleString()}`,
    `  Maintenance: Rp ${breakdown.variableCosts.maintenance.toLocaleString()}`,
    `  Marketing: Rp ${breakdown.variableCosts.marketing.toLocaleString()}`,
    `  Lainnya: Rp ${breakdown.variableCosts.other.toLocaleString()}`,
    `  Total Variable: Rp ${breakdown.variableCosts.total.toLocaleString()}`,
    '',
    `TOTAL OVERHEAD: Rp ${breakdown.totalOverhead.toLocaleString()}`
  ];

  return lines.join('\n');
}