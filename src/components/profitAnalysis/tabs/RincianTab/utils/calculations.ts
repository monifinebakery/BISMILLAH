import { ProfitAnalysisResult } from '../../types';
import { logger } from '@/utils/logger';

/**
 * Calculate cost analysis ratios
 */
export const calculateCostAnalysis = (profitData: ProfitAnalysisResult) => {
  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;

  // Validasi profitMarginData
  if (!profitMarginData || typeof profitMarginData.revenue !== 'number' || isNaN(profitMarginData.revenue)) {
    logger.warn('calculateCostAnalysis: profitMarginData tidak valid atau revenue tidak tersedia', { profitMarginData });
    return {
      materialRatio: 0,
      laborRatio: 0,
      overheadRatio: 0,
      cogsRatio: 0,
      opexRatio: 0,
      totalCostRatio: 0
    };
  }

  const revenue = profitMarginData.revenue;

  // Cegah pembagian dengan nol
  if (revenue === 0) {
    logger.warn('calculateCostAnalysis: revenue adalah nol', { profitMarginData });
    return {
      materialRatio: 0,
      laborRatio: 0,
      overheadRatio: 0,
      cogsRatio: 0,
      opexRatio: 0,
      totalCostRatio: 0
    };
  }

  return {
    materialRatio: (cogsBreakdown.totalMaterialCost / revenue) * 100,
    laborRatio: (cogsBreakdown.totalDirectLaborCost / revenue) * 100,
    overheadRatio: (cogsBreakdown.manufacturingOverhead / revenue) * 100,
    cogsRatio: (cogsBreakdown.totalCOGS / revenue) * 100,
    opexRatio: (opexBreakdown.totalOPEX / revenue) * 100,
    totalCostRatio: ((cogsBreakdown.totalCOGS + opexBreakdown.totalOPEX) / revenue) * 100
  };
};

/**
 * Calculate efficiency metrics
 */
export const calculateEfficiencyMetrics = (profitData: ProfitAnalysisResult) => {
  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;

  // Validasi profitMarginData
  if (!profitMarginData || typeof profitMarginData.revenue !== 'number' || isNaN(profitMarginData.revenue)) {
    logger.warn('calculateEfficiencyMetrics: profitMarginData tidak valid atau revenue tidak tersedia', { profitMarginData });
    return {
      revenuePerCost: 0,
      cogsEfficiency: 0,
      opexEfficiency: 0,
      materialEfficiency: 0,
      laborEfficiency: 0,
      overheadRate: 0
    };
  }

  const revenue = profitMarginData.revenue;
  const totalCosts = cogsBreakdown.totalCOGS + opexBreakdown.totalOPEX;

  // Cegah pembagian dengan nol
  const safeRevenue = revenue || 1;
  const safeCogs = cogsBreakdown.totalCOGS || 1;
  const safeOpex = opexBreakdown.totalOPEX || 1;
  const safeMaterial = cogsBreakdown.totalMaterialCost || 1;
  const safeLabor = cogsBreakdown.totalDirectLaborCost || 1;
  const safeTotalCogs = cogsBreakdown.totalCOGS || 1;

  return {
    revenuePerCost: totalCosts > 0 ? revenue / totalCosts : 0,
    cogsEfficiency: revenue / safeCogs,
    opexEfficiency: revenue / safeOpex,
    materialEfficiency: revenue / safeMaterial,
    laborEfficiency: revenue / safeLabor,
    overheadRate: safeTotalCogs > 0 ? (cogsBreakdown.manufacturingOverhead / safeTotalCogs) * 100 : 0
  };
};

/**
 * Calculate OPEX composition ratios
 */
export const calculateOpexComposition = (opexBreakdown: any) => {
  const total = opexBreakdown.totalOPEX;

  if (total === 0) {
    return {
      adminRatio: 0,
      sellingRatio: 0,
      generalRatio: 0
    };
  }

  return {
    adminRatio: (opexBreakdown.totalAdministrative / total) * 100,
    sellingRatio: (opexBreakdown.totalSelling / total) * 100,
    generalRatio: (opexBreakdown.totalGeneral / total) * 100
  };
};

/**
 * Calculate material usage statistics
 */
export const calculateMaterialUsageStats = (materialUsage: any[]) => {
  if (!materialUsage || materialUsage.length === 0) {
    return {
      totalRecords: 0,
      avgUnitCost: 0,
      totalCost: 0,
      usageByType: {},
      topMaterials: []
    };
  }

  const totalCost = materialUsage.reduce((sum, usage) => sum + usage.total_cost, 0);
  const avgUnitCost = materialUsage.reduce((sum, usage) => sum + usage.unit_cost, 0) / materialUsage.length;

  // Group by usage type
  const usageByType = materialUsage.reduce((acc, usage) => {
    acc[usage.usage_type] = (acc[usage.usage_type] || 0) + usage.total_cost;
    return acc;
  }, {} as Record<string, number>);

  // Group by material and get top materials
  const materialCosts = materialUsage.reduce((acc, usage) => {
    acc[usage.material_id] = (acc[usage.material_id] || 0) + usage.total_cost;
    return acc;
  }, {} as Record<string, number>);

  const topMaterials = Object.entries(materialCosts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([materialId, cost]) => ({ materialId, cost }));

  return {
    totalRecords: materialUsage.length,
    avgUnitCost,
    totalCost,
    usageByType,
    topMaterials
  };
};

/**
 * Calculate variance from target
 */
export const calculateVariance = (actual: number, target: number): {
  variance: number;
  variancePercent: number;
  isPositiveVariance: boolean;
} => {
  const variance = actual - target;
  const variancePercent = target !== 0 ? (variance / target) * 100 : 0;

  return {
    variance,
    variancePercent,
    isPositiveVariance: variance >= 0
  };
};

/**
 * Calculate cost distribution percentages
 */
export const calculateCostDistribution = (costs: { name: string; amount: number }[]) => {
  const total = costs.reduce((sum, cost) => sum + cost.amount, 0);

  if (total === 0) return costs.map(cost => ({ ...cost, percentage: 0 }));

  return costs.map(cost => ({
    ...cost,
    percentage: (cost.amount / total) * 100
  }));
};